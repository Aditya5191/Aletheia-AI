import asyncio
import os
import json
from typing import TypedDict, Annotated, Sequence
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

def clean_messages(messages):
    """Filter out empty text messages to prevent Vertex AI 400 errors."""
    clean = []
    for m in messages:
        if isinstance(m, ToolMessage):
            clean.append(m)
        elif getattr(m, 'tool_calls', None):
            clean.append(m)
        elif isinstance(m.content, str) and m.content.strip():
            clean.append(m)
        elif isinstance(m.content, list) and m.content:
            clean.append(m)
    return clean

async def run_langgraph_agent(
    container_id: str, 
    sandbox_url: str = "http://localhost:8000/sse", 
    lustitia_url: str = "https://web-production-6c63b.up.railway.app/sse"
):
    print(f"[NETWORK] Connecting to Sandbox MCP at {sandbox_url}...")
    async with sse_client(sandbox_url) as (sandbox_r, sandbox_w):
        async with ClientSession(sandbox_r, sandbox_w) as sandbox_session:
            await sandbox_session.initialize()
            sandbox_tools = await load_mcp_tools(sandbox_session)
            sandbox_tools = [t for t in sandbox_tools if t.name != "quit_sandbox"]
            print(f"[NETWORK] Sandbox tools loaded: {[t.name for t in sandbox_tools]}")
            
            print(f"[NETWORK] Connecting to Lustitia Auditor MCP at {lustitia_url}...")
            async with sse_client(lustitia_url) as (lustitia_r, lustitia_w):
                async with ClientSession(lustitia_r, lustitia_w) as lustitia_session:
                    await lustitia_session.initialize()
                    lustitia_tools = await load_mcp_tools(lustitia_session)
                    print(f"[NETWORK] Lustitia tools loaded: {[t.name for t in lustitia_tools]}\n")
                    
                    all_tools = sandbox_tools + lustitia_tools

                    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.abspath(".secrets/vertex-credentials.json")
                    
                    llm = ChatVertexAI(
                        model="gemini-2.5-flash",
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
                    llm_mitigator = llm.bind_tools(all_tools)

                    def data_surveyor(state: AgentState):
                        prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "data_surveyor.md")
                        with open(prompt_path, "r", encoding="utf-8") as f:
                            raw_prompt = f.read()
                        
                        system_prompt = SystemMessage(
                            content=raw_prompt.replace("{container_id}", container_id)
                        )
                        response = llm_surveyor.invoke([system_prompt] + clean_messages(state["messages"]))
                        return {"messages": [response], "sender": "data_surveyor"}
                        
                    def fairness_adjudicator(state: AgentState):
                        prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "fairness_adjudicator.md")
                        with open(prompt_path, "r", encoding="utf-8") as f:
                            raw_prompt = f.read()
                            
                        system_prompt = SystemMessage(
                            content=raw_prompt.replace("{container_id}", container_id)
                        )
                        response = llm_adjudicator.invoke([system_prompt] + clean_messages(state["messages"]))
                        return {"messages": [response], "sender": "fairness_adjudicator"}
                        
                    def mitigation_agent(state: AgentState):
                        prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "mitigation_agent.md")
                        with open(prompt_path, "r", encoding="utf-8") as f:
                            raw_prompt = f.read()
                            
                        system_prompt = SystemMessage(
                            content=raw_prompt.replace("{container_id}", container_id)
                        )
                        response = llm_mitigator.invoke([system_prompt] + clean_messages(state["messages"]))
                        return {"messages": [response], "sender": "mitigation_agent"}
                    
                    def router(state: AgentState):
                        last_msg = state["messages"][-1]
                        sender = state.get("sender", "")
                        
                        if last_msg.tool_calls:
                            return "tools"
                            
                        if sender == "data_surveyor":
                            return "fairness_adjudicator"
                            
                        if sender == "fairness_adjudicator":
                            return "mitigation_agent"
                            
                        return END

                    tools_node = ToolNode(all_tools)

                    workflow = StateGraph(AgentState)
                    workflow.add_node("data_surveyor", data_surveyor)
                    workflow.add_node("fairness_adjudicator", fairness_adjudicator)
                    workflow.add_node("mitigation_agent", mitigation_agent)
                    workflow.add_node("tools", tools_node)
                    
                    workflow.add_edge(START, "data_surveyor")
                    workflow.add_conditional_edges("data_surveyor", router, {"tools": "tools", "fairness_adjudicator": "fairness_adjudicator"})
                    workflow.add_conditional_edges("fairness_adjudicator", router, {"tools": "tools", "mitigation_agent": "mitigation_agent", END: END})
                    workflow.add_conditional_edges("mitigation_agent", router, {"tools": "tools", END: END})
                    workflow.add_conditional_edges("tools", lambda x: x["sender"], {"data_surveyor": "data_surveyor", "fairness_adjudicator": "fairness_adjudicator", "mitigation_agent": "mitigation_agent"})

                    app = workflow.compile()
                    
                    initial_message = HumanMessage(content="Please begin the execution. Surveyor, map out the data. Adjudicator, follow up with the fairness audit. Mitigator, follow up with the mitigation.")
                    
                    print("\n\033[1m\033[96m" + "="*50 + "\nStarting Unified Agent Workflow...\n" + "="*50 + "\033[0m\n")
                    async for event in app.astream({"messages": [initial_message], "sender": "user"}, stream_mode="values"):
                        last_message = event["messages"][-1]
                        sender = event.get("sender", "SYSTEM").upper()
                        
                        if isinstance(last_message, HumanMessage):
                            print(f"\033[1m\033[92m[USER]\033[0m\n{last_message.content}\n")
                        elif isinstance(last_message, AIMessage):
                            if last_message.tool_calls:
                                tools_str = ", ".join([t['name'] for t in last_message.tool_calls])
                                print(f"\033[1m\033[93m[{sender} ACTION]\033[0m Decided to use: {tools_str}")
                                for t in last_message.tool_calls:
                                    args_str = str(t.get('args', {}))
                                    if len(args_str) > 1500:
                                        args_str = args_str[:1500] + " ... [TRUNCATED]"
                                    print(f"  \033[90m↳ args: {args_str}\033[0m")
                            else:
                                print(f"\033[1m\033[95m[{sender} FINAL RESPONSE]\033[0m\n{last_message.content}\n")
                        elif isinstance(last_message, ToolMessage):
                            limit = 350
                            res_str = str(last_message.content)
                            if len(res_str) > limit:
                                res_str = res_str[:limit] + f"\n... [TRUNCATED {len(res_str)-limit} bytes]"
                            print(f"\n\033[1m\033[94m[TOOL RESULT: {last_message.name}]\033[0m\n{res_str}\n" + "-"*50 + "\n")
