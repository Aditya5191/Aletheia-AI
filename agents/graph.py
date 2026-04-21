import asyncio
import os
import json
from typing import TypedDict, Annotated, Sequence, AsyncGenerator
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, ToolMessage, AIMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_google_vertexai import ChatVertexAI, HarmCategory, HarmBlockThreshold
from langgraph.prebuilt import ToolNode

from mcp import ClientSession
from mcp.client.sse import sse_client
from langchain_mcp_adapters.tools import load_mcp_tools
from dotenv import load_dotenv

load_dotenv()

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    sender: str

async def run_langgraph_agent(
    container_id: str, 
    sandbox_url: str = "http://localhost:8000/sse", 
    lustitia_url: str = "https://web-production-6c63b.up.railway.app/sse"
) -> AsyncGenerator[dict, None]:
    
    try:
        yield {"type": "status", "message": "Connecting to MCP servers..."}
        
        async with sse_client(sandbox_url) as (sandbox_r, sandbox_w):
            async with ClientSession(sandbox_r, sandbox_w) as sandbox_session:
                await sandbox_session.initialize()
                sandbox_tools = await load_mcp_tools(sandbox_session)
                sandbox_tools = [t for t in sandbox_tools if t.name != "quit_sandbox"]
                
                async with sse_client(lustitia_url) as (lustitia_r, lustitia_w):
                    async with ClientSession(lustitia_r, lustitia_w) as lustitia_session:
                        await lustitia_session.initialize()
                        lustitia_tools = await load_mcp_tools(lustitia_session)
                        
                        all_tools = sandbox_tools + lustitia_tools
                        
                        # Set up Vertex AI credentials securely pointing to your JSON file
                        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.abspath(".secrets/vertex-credentials.json")
                        
                        # Fix tool schemas for Vertex AI (remove additionalProperties)
                        def patch_tool(tool):
                            if hasattr(tool, "args_schema") and hasattr(tool.args_schema, "schema"):
                                orig_schema = tool.args_schema.schema
                                def patched_schema(*args, **kwargs):
                                    s = orig_schema(*args, **kwargs)
                                    s.pop("additionalProperties", None)
                                    return s
                                tool.args_schema.schema = patched_schema
                            return tool

                        sandbox_tools = [patch_tool(t) for t in sandbox_tools]
                        lustitia_tools = [patch_tool(t) for t in lustitia_tools]
                        all_tools = sandbox_tools + lustitia_tools

                        llm = ChatVertexAI(
                            model="gemini-2.5-pro",
                            temperature=0.2,
                            safety_settings={
                                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                            }
                        )

                        llm_surveyor = llm.bind_tools(sandbox_tools)
                        llm_adjudicator = llm.bind_tools(all_tools)

                        def sanitize_messages(messages):
                            """Ensure no message has empty content, as it crashes Gemini 2.5."""
                            sanitized = []
                            for msg in messages:
                                if not msg.content or str(msg.content).strip() == "":
                                    # If it has tool calls, Gemini allows empty content in some contexts, 
                                    # but the SDK often fails. We provide a placeholder.
                                    if hasattr(msg, "tool_calls") and msg.tool_calls:
                                        msg.content = "I will use these tools:"
                                    else:
                                        msg.content = "Continuing..."
                                sanitized.append(msg)
                            return sanitized

                        def data_surveyor(state: AgentState):
                            prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "data_surveyor.md")
                            with open(prompt_path, "r", encoding="utf-8") as f:
                                raw_prompt = f.read()
                            
                            content = raw_prompt.format(container_id=container_id)
                            system_msg = SystemMessage(content=content)
                            
                            messages = sanitize_messages(list(state["messages"]))
                            final_messages = [system_msg] + messages
                            
                            print(f"DEBUG: Data Surveyor calling gemini-2.5-pro with {len(final_messages)} messages.")
                            response = llm_surveyor.invoke(final_messages)
                            return {"messages": [response], "sender": "data_surveyor"}
                            
                        def fairness_adjudicator(state: AgentState):
                            prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "fairness_adjudicator.md")
                            with open(prompt_path, "r", encoding="utf-8") as f:
                                raw_prompt = f.read()
                            
                            content = raw_prompt.format(container_id=container_id)
                            system_msg = SystemMessage(content=content)
                            
                            messages = sanitize_messages(list(state["messages"]))
                            final_messages = [system_msg] + messages
                            
                            print(f"DEBUG: Fairness Adjudicator calling gemini-2.5-pro with {len(final_messages)} messages.")
                            response = llm_adjudicator.invoke(final_messages)
                            return {"messages": [response], "sender": "fairness_adjudicator"}
                        
                        def router(state: AgentState):
                            last_msg = state["messages"][-1]
                            sender = state.get("sender", "")
                            if last_msg.tool_calls: return "tools"
                            if sender == "data_surveyor": return "fairness_adjudicator"
                            return END

                        tools_node = ToolNode(all_tools)

                        workflow = StateGraph(AgentState)
                        workflow.add_node("data_surveyor", data_surveyor)
                        workflow.add_node("fairness_adjudicator", fairness_adjudicator)
                        workflow.add_node("tools", tools_node)
                        workflow.add_edge(START, "data_surveyor")
                        workflow.add_conditional_edges("data_surveyor", router, {"tools": "tools", "fairness_adjudicator": "fairness_adjudicator"})
                        workflow.add_conditional_edges("fairness_adjudicator", router, {"tools": "tools", END: END})
                        workflow.add_conditional_edges("tools", lambda x: x["sender"], {"data_surveyor": "data_surveyor", "fairness_adjudicator": "fairness_adjudicator"})

                        app = workflow.compile()
                        
                        initial_message = HumanMessage(content="Please begin the execution. Surveyor, map out the data. Adjudicator, follow up with the fairness audit.")
                        
                        yield {"type": "status", "message": "Workflow initiated."}

                        async for event in app.astream({"messages": [initial_message], "sender": "user"}, stream_mode="values"):
                            last_message = event["messages"][-1]
                            sender = event.get("sender", "user").upper()
                            
                            if isinstance(last_message, AIMessage):
                                if last_message.tool_calls:
                                    yield {
                                        "type": "thought",
                                        "sender": sender,
                                        "content": f"Decided to use: {', '.join([t['name'] for t in last_message.tool_calls])}",
                                        "tool_calls": last_message.tool_calls
                                    }
                                else:
                                    yield {
                                        "type": "response",
                                        "sender": sender,
                                        "content": last_message.content
                                    }
                            elif isinstance(last_message, ToolMessage):
                                yield {
                                    "type": "tool_result",
                                    "tool_name": last_message.name,
                                    "content": str(last_message.content)
                                }
                            
                        yield {"type": "status", "message": "Audit complete."}
    finally:
        # Explicit cleanup if needed, but 'async with' handles most of it.
        # This block ensures that even if GeneratorExit is raised, we exit the context managers cleanly.
        pass

