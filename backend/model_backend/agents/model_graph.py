import asyncio
import os
from typing import TypedDict, Annotated, Sequence, Literal
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


async def run_model_pipeline(
    container_id: str,
    sandbox_url: str = "http://localhost:8000/sse",
    aletheia_url: str = "https://web-production-6c63b.up.railway.app/sse",
    miscellaneous_url: str = "http://localhost:8002/sse"
):
    print(f"[MODEL PIPELINE] Starting for container '{container_id}'")

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
                    print(f"[NETWORK] Aletheia tools loaded: {[t.name for t in aletheia_tools]}")

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
                                    if hasattr(tool.args_schema, "model_config"):
                                        if isinstance(tool.args_schema.model_config, dict):
                                            tool.args_schema.model_config["extra"] = "allow"
                                    elif hasattr(tool.args_schema, "Config"):
                                        tool.args_schema.Config.extra = "allow"
                            # ---------------------------------------------

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

                            # Agent 1 only needs sandbox + misc — no auditor MCP calls yet
                            llm_inspector   = llm.bind_tools(sandbox_tools + misc_tools)
                            # Agents 2, 3, 4 need all tools including auditor MCP
                            llm_auditor     = llm.bind_tools(all_tools)
                            llm_calibrator  = llm.bind_tools(all_tools)
                            llm_compiler    = llm.bind_tools(all_tools)

                            # ─────────────────────────────────────────────
                            # AGENT NODES
                            # ─────────────────────────────────────────────

                            def model_inspector(state: AgentState):
                                prompt_path = os.path.join(
                                    os.path.dirname(__file__), "..", "prompts", "model_inspector.md"
                                )
                                with open(prompt_path, "r", encoding="utf-8") as f:
                                    raw_prompt = f.read()
                                system_prompt = SystemMessage(
                                    content=raw_prompt.replace("{container_id}", container_id)
                                )
                                response = llm_inspector.invoke(
                                    [system_prompt] + clean_messages(state["messages"])
                                )
                                return {"messages": [response], "sender": "model_inspector"}

                            def behavioral_auditor(state: AgentState):
                                prompt_path = os.path.join(
                                    os.path.dirname(__file__), "..", "prompts", "behavioral_auditor.md"
                                )
                                with open(prompt_path, "r", encoding="utf-8") as f:
                                    raw_prompt = f.read()
                                system_prompt = SystemMessage(
                                    content=raw_prompt.replace("{container_id}", container_id)
                                )
                                response = llm_auditor.invoke(
                                    [system_prompt] + clean_messages(state["messages"])
                                )
                                return {"messages": [response], "sender": "behavioral_auditor"}

                            def threshold_calibrator(state: AgentState):
                                prompt_path = os.path.join(
                                    os.path.dirname(__file__), "..", "prompts", "threshold_calibrator.md"
                                )
                                with open(prompt_path, "r", encoding="utf-8") as f:
                                    raw_prompt = f.read()
                                system_prompt = SystemMessage(
                                    content=raw_prompt.replace("{container_id}", container_id)
                                )
                                response = llm_calibrator.invoke(
                                    [system_prompt] + clean_messages(state["messages"])
                                )
                                return {"messages": [response], "sender": "threshold_calibrator"}

                            def report_compiler(state: AgentState):
                                # Shared prompt with dataset pipeline — reads same output file names
                                prompt_path = os.path.join(
                                    os.path.dirname(__file__), "..", "prompts", "report_compiler.md"
                                )
                                with open(prompt_path, "r", encoding="utf-8") as f:
                                    raw_prompt = f.read()
                                system_prompt = SystemMessage(
                                    content=raw_prompt.replace("{container_id}", container_id)
                                )
                                response = llm_compiler.invoke(
                                    [system_prompt] + clean_messages(state["messages"])
                                )
                                return {"messages": [response], "sender": "report_compiler"}

                            # ─────────────────────────────────────────────
                            # HANDOFF NODES
                            # ─────────────────────────────────────────────

                            def handoff_to_behavioral_auditor(state: AgentState):
                                delete_messages = [RemoveMessage(id=m.id) for m in state["messages"]]
                                handoff_msg = HumanMessage(content=(
                                    "Model Inspector complete. "
                                    "model_profile.md, predictions.csv, and attributes.json "
                                    "saved to /workspace/outputs/. "
                                    "Read them via bash and begin the behavioral fairness audit."
                                ))
                                return {
                                    "messages": delete_messages + [handoff_msg],
                                    "sender": "handoff"
                                }

                            def handoff_to_threshold_calibrator(state: AgentState):
                                delete_messages = [RemoveMessage(id=m.id) for m in state["messages"]]
                                handoff_msg = HumanMessage(content=(
                                    "Behavioral Auditor complete. "
                                    "agent2.md, agent2_charts.json, and agent2_metrics.json "
                                    "saved to /workspace/outputs/. "
                                    "Read them via bash and begin threshold calibration."
                                ))
                                return {
                                    "messages": delete_messages + [handoff_msg],
                                    "sender": "handoff"
                                }

                            def handoff_to_compiler(state: AgentState):
                                delete_messages = [RemoveMessage(id=m.id) for m in state["messages"]]
                                handoff_msg = HumanMessage(content=(
                                    "Threshold Calibrator complete. "
                                    "agent3.md, agent3_charts.json, agent3_metrics.json, "
                                    "threshold_map.json, and fixed_predictions.csv "
                                    "saved to /workspace/outputs/. "
                                    "Read them via bash and begin report compilation."
                                ))
                                return {
                                    "messages": delete_messages + [handoff_msg],
                                    "sender": "handoff"
                                }

                            # ─────────────────────────────────────────────
                            # ROUTER
                            # ─────────────────────────────────────────────

                            def router(state: AgentState):
                                last_msg = state["messages"][-1]
                                sender = state.get("sender", "")

                                # If the last message has tool calls, always go to tools first
                                if last_msg.tool_calls:
                                    return "tools"

                                # After tool execution returns, go back to whoever called the tool
                                # This is handled by the tools → sender edge below

                                # When an agent finishes (no tool calls), advance to next handoff
                                if sender == "model_inspector":
                                    return "handoff_to_behavioral_auditor"

                                if sender == "behavioral_auditor":
                                    return "handoff_to_threshold_calibrator"

                                if sender == "threshold_calibrator":
                                    return "handoff_to_compiler"

                                return END

                            # ─────────────────────────────────────────────
                            # GRAPH ASSEMBLY
                            # ─────────────────────────────────────────────

                            tools_node = ToolNode(all_tools)

                            workflow = StateGraph(AgentState)

                            # Agent nodes
                            workflow.add_node("model_inspector",              model_inspector)
                            workflow.add_node("behavioral_auditor",           behavioral_auditor)
                            workflow.add_node("threshold_calibrator",         threshold_calibrator)
                            workflow.add_node("report_compiler",              report_compiler)

                            # Handoff nodes
                            workflow.add_node("handoff_to_behavioral_auditor",  handoff_to_behavioral_auditor)
                            workflow.add_node("handoff_to_threshold_calibrator", handoff_to_threshold_calibrator)
                            workflow.add_node("handoff_to_compiler",            handoff_to_compiler)

                            # Shared tools node
                            workflow.add_node("tools", tools_node)

                            # Edges
                            workflow.add_edge(START, "model_inspector")

                            workflow.add_conditional_edges(
                                "model_inspector", router,
                                {
                                    "tools": "tools",
                                    "handoff_to_behavioral_auditor": "handoff_to_behavioral_auditor"
                                }
                            )

                            workflow.add_edge("handoff_to_behavioral_auditor", "behavioral_auditor")

                            workflow.add_conditional_edges(
                                "behavioral_auditor", router,
                                {
                                    "tools": "tools",
                                    "handoff_to_threshold_calibrator": "handoff_to_threshold_calibrator"
                                }
                            )

                            workflow.add_edge("handoff_to_threshold_calibrator", "threshold_calibrator")

                            workflow.add_conditional_edges(
                                "threshold_calibrator", router,
                                {
                                    "tools": "tools",
                                    "handoff_to_compiler": "handoff_to_compiler"
                                }
                            )

                            workflow.add_edge("handoff_to_compiler", "report_compiler")

                            workflow.add_conditional_edges(
                                "report_compiler", router,
                                {
                                    "tools": "tools",
                                    END: END
                                }
                            )

                            # After any tool call completes, return to whoever called it
                            workflow.add_conditional_edges(
                                "tools",
                                lambda x: x["sender"],
                                {
                                    "model_inspector":      "model_inspector",
                                    "behavioral_auditor":   "behavioral_auditor",
                                    "threshold_calibrator": "threshold_calibrator",
                                    "report_compiler":      "report_compiler"
                                }
                            )

                            app = workflow.compile()

                            # ─────────────────────────────────────────────
                            # RUN + STREAM
                            # Identical streaming pattern to graph.py
                            # ─────────────────────────────────────────────

                            initial_message = HumanMessage(content=(
                                "Please begin the model audit execution. "
                                "Model Inspector: load and profile the uploaded model and sample. "
                                "Behavioral Auditor: follow up with the fairness audit on model predictions. "
                                "Threshold Calibrator: follow up with threshold calibration and mitigation. "
                                "Report Compiler: follow up with the final report."
                            ))

                            print("\n\033[1m\033[96m" + "="*50 + "\nStarting Model Audit Pipeline...\n" + "="*50 + "\033[0m\n")

                            async for event in app.astream(
                                {"messages": [initial_message], "sender": "user"},
                                stream_mode="values"
                            ):
                                # --- Mitigation for 429 Resource Exhausted ---
                                await asyncio.sleep(2) # Give the API a moment between events
                                
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