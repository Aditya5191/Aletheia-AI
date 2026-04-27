import asyncio
import os
import json
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, ToolMessage, AIMessage, RemoveMessage
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
    aletheia_url: str = "https://web-production-6c63b.up.railway.app/sse",
    miscellaneous_url: str = "http://localhost:8002/sse"
):
    print(f"[NETWORK] Connecting to Sandbox MCP at {sandbox_url}...")
    async with sse_client(sandbox_url, timeout=300) as (sandbox_r, sandbox_w):
        async with ClientSession(sandbox_r, sandbox_w) as sandbox_session:
            await sandbox_session.initialize()
            sandbox_tools = await load_mcp_tools(sandbox_session)
            sandbox_tools = [t for t in sandbox_tools if t.name != "quit_sandbox"]
            print(f"[NETWORK] Sandbox tools loaded: {[t.name for t in sandbox_tools]}")
            
            print(f"[NETWORK] Connecting to Aletheia Auditor MCP at {aletheia_url}...")
            async with sse_client(aletheia_url, timeout=300) as (aletheia_r, aletheia_w):
                async with ClientSession(aletheia_r, aletheia_w) as aletheia_session:
                    await aletheia_session.initialize()
                    aletheia_tools = await load_mcp_tools(aletheia_session)
                    print(f"[NETWORK] Aletheia tools loaded: {[t.name for t in aletheia_tools]}\n")
                    print(f"[NETWORK] Connecting to Miscellaneous MCP at {miscellaneous_url}...")
                    async with sse_client(miscellaneous_url, timeout=300) as (misc_r, misc_w):
                        async with ClientSession(misc_r, misc_w) as misc_session:
                            await misc_session.initialize()
                            misc_tools = await load_mcp_tools(misc_session)
                            print(f"[NETWORK] Miscellaneous tools loaded: {[t.name for t in misc_tools]}\n")
                            
                            all_tools = sandbox_tools + aletheia_tools + misc_tools

                            # --- Fix additionalProperties Schema Warning ---
                            for tool in all_tools:
                                if hasattr(tool, "args_schema") and tool.args_schema is not None:
                                    # Pydantic v2
                                    if hasattr(tool.args_schema, "model_config"):
                                        # If model_config is a dict, update it directly
                                        if isinstance(tool.args_schema.model_config, dict):
                                            tool.args_schema.model_config["extra"] = "allow"
                                    # Pydantic v1 fallback
                                    elif hasattr(tool.args_schema, "Config"):
                                        tool.args_schema.Config.extra = "allow"
                            # -----------------------------------------------

                            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.abspath(".secrets/vertex-credentials.json")

                            llm = ChatVertexAI(
                                model="gemini-3.1-pro-preview",
                                location="global",
                                temperature=0.2,
                                safety_settings={
                                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                                }
                            )

                            llm_surveyor = llm.bind_tools(sandbox_tools + misc_tools)
                            llm_adjudicator = llm.bind_tools(all_tools)
                            llm_mitigator = llm.bind_tools(all_tools)
                            llm_compiler = llm.bind_tools(all_tools)

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

                            def report_compiler(state: AgentState):
                                prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "report_compiler.md")
                                with open(prompt_path, "r", encoding="utf-8") as f:
                                    raw_prompt = f.read()

                                system_prompt = SystemMessage(
                                    content=raw_prompt.replace("{container_id}", container_id)
                                )
                                response = llm_compiler.invoke([system_prompt] + clean_messages(state["messages"]))
                                return {"messages": [response], "sender": "report_compiler"}

                            # ── Handoff nodes: wipe history between agents ──
                            def handoff_to_adjudicator(state: AgentState):
                                """Clear Agent 1's message history. Agent 2 reads agent1.md from disk."""
                                delete_messages = [RemoveMessage(id=m.id) for m in state["messages"]]
                                handoff_msg = HumanMessage(content="Data Surveyor complete. Report saved to /workspace/outputs/agent1.md. Read it via bash and begin the fairness audit.")
                                return {
                                    "messages": delete_messages + [handoff_msg],
                                    "sender": "handoff"
                                }

                            def handoff_to_mitigator(state: AgentState):
                                """Clear Agent 2's message history. Agent 3 reads agent1.md + agent2.md from disk."""
                                delete_messages = [RemoveMessage(id=m.id) for m in state["messages"]]
                                handoff_msg = HumanMessage(content="Fairness Adjudicator complete. Reports saved to /workspace/outputs/agent1.md and /workspace/outputs/agent2.md. Read them via bash and begin bias mitigation.")
                                return {
                                    "messages": delete_messages + [handoff_msg],
                                    "sender": "handoff"
                                }

                            def handoff_to_compiler(state: AgentState):
                                """Clear Agent 3's message history. Agent 4 reads agent1.md, agent2.md, agent3.md from disk."""
                                delete_messages = [RemoveMessage(id=m.id) for m in state["messages"]]
                                handoff_msg = HumanMessage(content="Mitigation Agent complete. All reports and charts saved. Read them via bash and begin report compilation.")
                                return {
                                    "messages": delete_messages + [handoff_msg],
                                    "sender": "handoff"
                                }

                            def router(state: AgentState):
                                last_msg = state["messages"][-1]
                                sender = state.get("sender", "")

                                if last_msg.tool_calls:
                                    return "tools"

                                if sender == "data_surveyor":
                                    return "handoff_to_adjudicator"

                                if sender == "fairness_adjudicator":
                                    return "handoff_to_mitigator"

                                if sender == "mitigation_agent":
                                    return "handoff_to_compiler"

                                return END

                            tools_node = ToolNode(all_tools)

                            workflow = StateGraph(AgentState)
                            workflow.add_node("data_surveyor", data_surveyor)
                            workflow.add_node("handoff_to_adjudicator", handoff_to_adjudicator)
                            workflow.add_node("fairness_adjudicator", fairness_adjudicator)
                            workflow.add_node("handoff_to_mitigator", handoff_to_mitigator)
                            workflow.add_node("mitigation_agent", mitigation_agent)
                            workflow.add_node("handoff_to_compiler", handoff_to_compiler)
                            workflow.add_node("report_compiler", report_compiler)
                            workflow.add_node("tools", tools_node)

                            workflow.add_edge(START, "data_surveyor")
                            workflow.add_conditional_edges("data_surveyor", router, {"tools": "tools", "handoff_to_adjudicator": "handoff_to_adjudicator"})
                            workflow.add_edge("handoff_to_adjudicator", "fairness_adjudicator")
                            workflow.add_conditional_edges("fairness_adjudicator", router, {"tools": "tools", "handoff_to_mitigator": "handoff_to_mitigator", END: END})
                            workflow.add_edge("handoff_to_mitigator", "mitigation_agent")
                            workflow.add_conditional_edges("mitigation_agent", router, {"tools": "tools", "handoff_to_compiler": "handoff_to_compiler", END: END})
                            workflow.add_edge("handoff_to_compiler", "report_compiler")
                            workflow.add_conditional_edges("report_compiler", router, {"tools": "tools", END: END})
                            workflow.add_conditional_edges("tools", lambda x: x["sender"], {"data_surveyor": "data_surveyor", "fairness_adjudicator": "fairness_adjudicator", "mitigation_agent": "mitigation_agent", "report_compiler": "report_compiler"})

                            app = workflow.compile()

                            initial_message = HumanMessage(content="Please begin the execution. Surveyor, map out the data. Adjudicator, follow up with the fairness audit. Mitigator, follow up with the mitigation. Compiler, follow up with the final report.")

                            print("\n\033[1m\033[96m" + "="*50 + "\nStarting Unified Agent Workflow...\n" + "="*50 + "\033[0m\n")
                            async for event in app.astream({"messages": [initial_message], "sender": "user"}, stream_mode="values"):
                                last_message = event["messages"][-1]
                                sender = event.get("sender", "SYSTEM").upper()

                                if isinstance(last_message, HumanMessage):
                                    print(f"\033[1m\033[92m[USER]\033[0m\n{last_message.content}\n")
                                    yield {"type": "message", "sender": sender, "content": last_message.content}
                                elif isinstance(last_message, AIMessage):
                                    if last_message.tool_calls:
                                        tools_str = ", ".join([t['name'] for t in last_message.tool_calls])
                                        print(f"\033[1m\033[93m[{sender} ACTION]\033[0m Decided to use: {tools_str}")
                                        for t in last_message.tool_calls:
                                            args_str = str(t.get('args', {}))
                                            if len(args_str) > 1500:
                                                args_str = args_str[:1500] + " ... [TRUNCATED]"
                                            print(f"  \033[90m↳ args: {args_str}\033[0m")
                                        yield {"type": "tool_calls", "sender": sender, "tool_calls": last_message.tool_calls}
                                    else:
                                        print(f"\033[1m\033[95m[{sender} FINAL RESPONSE]\033[0m\n{last_message.content}\n")
                                        yield {"type": "message", "sender": sender, "content": last_message.content}
                                elif isinstance(last_message, ToolMessage):
                                    limit = 350
                                    res_str = str(last_message.content)
                                    if len(res_str) > limit:
                                        res_str = res_str[:limit] + f"\n... [TRUNCATED {len(res_str)-limit} bytes]"
                                    print(f"\n\033[1m\033[94m[TOOL RESULT: {last_message.name}]\033[0m\n{res_str}\n" + "-"*50 + "\n")
                                    ws_content = str(last_message.content)
                                    if len(ws_content) > 2000:
                                        ws_content = ws_content[:2000] + f"\n... [TRUNCATED {len(ws_content)-2000} chars]"
                                    yield {"type": "tool_result", "sender": sender, "name": last_message.name, "content": ws_content}
