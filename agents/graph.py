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
    
    print(f"[NETWORK] Connecting to Sandbox MCP at {sandbox_url}...")
    async with sse_client(sandbox_url) as (sandbox_r, sandbox_w):
        async with ClientSession(sandbox_r, sandbox_w) as sandbox_session:
            await sandbox_session.initialize()
            sandbox_tools = await load_mcp_tools(sandbox_session)
            # Prevent the agent from accidentally shutting down the persistent container
            sandbox_tools = [t for t in sandbox_tools if t.name != "quit_sandbox"]
            print(f"[NETWORK] Sandbox tools loaded: {[t.name for t in sandbox_tools]}")
            
            print(f"[NETWORK] Connecting to Lustitia Auditor MCP at {lustitia_url}...")
            async with sse_client(lustitia_url) as (lustitia_r, lustitia_w):
                async with ClientSession(lustitia_r, lustitia_w) as lustitia_session:
                    await lustitia_session.initialize()
                    lustitia_tools = await load_mcp_tools(lustitia_session)
                    print(f"[NETWORK] Lustitia tools loaded: {[t.name for t in lustitia_tools]}\n")
                    
                    all_tools = sandbox_tools + lustitia_tools

                    # Set up Vertex AI credentials securely pointing to your JSON file
                    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.abspath(".secrets/vertex-credentials.json")
                    
                    # Ensure we have our shared model
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

                    # AGENT 1: Data Surveyor
                    def data_surveyor(state: AgentState):
                        prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "data_surveyor.md")
                        with open(prompt_path, "r", encoding="utf-8") as f:
                            raw_prompt = f.read()
                        
                        system_prompt = SystemMessage(
                            content=raw_prompt.format(container_id=container_id)
                        )
                        response = llm_surveyor.invoke([system_prompt] + state["messages"])
                        return {"messages": [response], "sender": "data_surveyor"}
                        
                    # AGENT 2: Fairness Adjudicator
                    def fairness_adjudicator(state: AgentState):
                        prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "fairness_adjudicator.md")
                        with open(prompt_path, "r", encoding="utf-8") as f:
                            raw_prompt = f.read()
                            
                        system_prompt = SystemMessage(
                            content=raw_prompt.format(container_id=container_id)
                        )
                        response = llm_adjudicator.invoke([system_prompt] + state["messages"])
                        return {"messages": [response], "sender": "fairness_adjudicator"}
                    
                    # ROUTER
                    def router(state: AgentState):
                        last_msg = state["messages"][-1]
                        sender = state.get("sender", "")
                        
                        # If the agent called a tool, send execution to ToolNode
                        if last_msg.tool_calls:
                            return "tools"
                            
                        # If Surveyor just finished answering without tools, jump to Adjudicator
                        if sender == "data_surveyor":
                            return "fairness_adjudicator"
                            
                        # If Adjudicator finished, execution ends
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

