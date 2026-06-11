# model_graph.py

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


# ─────────────────────────────────────────────────────────────────
# PROMPT FILENAME MAP
# Each model_type maps to its four agent prompt filenames
# Classification uses: model_inspector, behavioral_auditor,
#                      threshold_calibrator, report_compiler
# Regression uses:     model_profiler, disparity_auditor,
#                      output_recalibrator, report_compiler
# ─────────────────────────────────────────────────────────────────

PROMPT_MAP = {
    "classification": {
        "agent1":  "classification/model_inspector.md",
        "agent2":  "classification/behavioral_auditor.md",
        "agent3":  "classification/threshold_calibrator.md",
        "agent4":  "classification/report_compiler.md",
        # Sender names for api.py agent tracking
        "sender1": "model_inspector",
        "sender2": "behavioral_auditor",
        "sender3": "threshold_calibrator",
        "sender4": "report_compiler",
        # Handoff messages
        "handoff1": (
            "Model Inspector complete. "
            "model_agent1.md, predictions.csv, and model_attributes.json "
            "saved to /workspace/outputs/. "
            "Read them and begin the behavioral fairness audit."
        ),
        "handoff2": (
            "Behavioral Auditor complete. "
            "model_agent2.md, model_agent2_charts.json, model_agent2_metrics.json, "
            "and model_algorithm_selection.json saved to /workspace/outputs/. "
            "Read model_algorithm_selection.json first to get the mitigation algorithm. "
            "Then begin threshold calibration."
        ),
        "handoff3": (
            "Threshold Calibrator complete. "
            "model_agent3.md, model_agent3_charts.json, model_agent3_metrics.json, "
            "threshold_map.json, and fixed_predictions.csv "
            "saved to /workspace/outputs/. "
            "Read them and begin report compilation."
        ),
        "initial_message": (
            "Please begin the classification model audit. "
            "Model Inspector: load and profile the uploaded model and sample. "
            "Behavioral Auditor: follow up with the fairness audit on model predictions. "
            "Threshold Calibrator: follow up with threshold calibration and mitigation. "
            "Report Compiler: follow up with the final report."
        ),
    },
    "regression": {
        "agent1":  "regression/model_profiler.md",
        "agent2":  "regression/disparity_auditor.md",
        "agent3":  "regression/output_recalibrator.md",
        "agent4":  "regression/report_compiler.md",
        "sender1": "model_profiler",
        "sender2": "disparity_auditor",
        "sender3": "output_recalibrator",
        "sender4": "report_compiler",
        "handoff1": (
            "Model Profiler complete. "
            "model_agent1.md, predictions.csv, and model_attributes.json "
            "saved to /workspace/outputs/. "
            "Read them and begin the disparity audit."
        ),
        "handoff2": (
            "Disparity Auditor complete. "
            "model_agent2.md, model_agent2_charts.json, model_agent2_metrics.json, "
            "and model_algorithm_selection.json saved to /workspace/outputs/. "
            "Read model_algorithm_selection.json first to get the mitigation algorithm. "
            "Then begin output recalibration."
        ),
        "handoff3": (
            "Output Recalibrator complete. "
            "model_agent3.md, model_agent3_charts.json, model_agent3_metrics.json, "
            "correction_map.json, and fixed_predictions.csv "
            "saved to /workspace/outputs/. "
            "Read them and begin report compilation."
        ),
        "initial_message": (
            "Please begin the regression model disparity audit. "
            "Model Profiler: load and profile the uploaded model and sample. "
            "Disparity Auditor: follow up with the disparity audit on model predictions. "
            "Output Recalibrator: follow up with output recalibration. "
            "Report Compiler: follow up with the final report."
        ),
    }
}


async def run_model_pipeline(
    container_id: str,
    model_type: Literal["classification", "regression"] = "classification",
    sandbox_url: str = "http://localhost:8000/sse",
    aletheia_url: str = "https://web-production-6c63b.up.railway.app/sse",
    miscellaneous_url: str = "http://localhost:8002/sse"
):
    if model_type not in PROMPT_MAP:
        raise ValueError(f"model_type must be 'classification' or 'regression', got '{model_type}'")

    prompts   = PROMPT_MAP[model_type]
    prompts_dir = os.path.join(os.path.dirname(__file__), "." , "prompts")

    print(f"[MODEL PIPELINE] Starting — model_type='{model_type}', container='{container_id}'")

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

                            # Agent 1 only needs sandbox + misc — no auditor MCP yet
                            llm_agent1 = llm.bind_tools(sandbox_tools + misc_tools)
                            # Agents 2, 3, 4 need all tools including auditor MCP
                            llm_agent2 = llm.bind_tools(all_tools)
                            llm_agent3 = llm.bind_tools(all_tools)
                            llm_agent4 = llm.bind_tools(all_tools)

                            # ─────────────────────────────────────────────
                            # HELPER — loads prompt by key from PROMPT_MAP
                            # ─────────────────────────────────────────────

                            def load_prompt(key: str) -> str:
                                path = os.path.join(prompts_dir, prompts[key])
                                with open(path, "r", encoding="utf-8") as f:
                                    return f.read().replace("{container_id}", container_id)

                            # ─────────────────────────────────────────────
                            # AGENT NODES — generic, read prompt by key
                            # ─────────────────────────────────────────────

                            def agent1(state: AgentState):
                                response = llm_agent1.invoke(
                                    [SystemMessage(content=load_prompt("agent1"))]
                                    + clean_messages(state["messages"])
                                )
                                return {"messages": [response], "sender": prompts["sender1"]}

                            def agent2(state: AgentState):
                                response = llm_agent2.invoke(
                                    [SystemMessage(content=load_prompt("agent2"))]
                                    + clean_messages(state["messages"])
                                )
                                return {"messages": [response], "sender": prompts["sender2"]}

                            def agent3(state: AgentState):
                                response = llm_agent3.invoke(
                                    [SystemMessage(content=load_prompt("agent3"))]
                                    + clean_messages(state["messages"])
                                )
                                return {"messages": [response], "sender": prompts["sender3"]}

                            def agent4(state: AgentState):
                                response = llm_agent4.invoke(
                                    [SystemMessage(content=load_prompt("agent4"))]
                                    + clean_messages(state["messages"])
                                )
                                return {"messages": [response], "sender": prompts["sender4"]}

                            # ─────────────────────────────────────────────
                            # HANDOFF NODES
                            # ─────────────────────────────────────────────

                            def handoff_to_agent2(state: AgentState):
                                delete_messages = [RemoveMessage(id=m.id) for m in state["messages"]]
                                return {
                                    "messages": delete_messages + [HumanMessage(content=prompts["handoff1"])],
                                    "sender": "handoff"
                                }

                            def handoff_to_agent3(state: AgentState):
                                delete_messages = [RemoveMessage(id=m.id) for m in state["messages"]]
                                return {
                                    "messages": delete_messages + [HumanMessage(content=prompts["handoff2"])],
                                    "sender": "handoff"
                                }

                            def handoff_to_agent4(state: AgentState):
                                delete_messages = [RemoveMessage(id=m.id) for m in state["messages"]]
                                return {
                                    "messages": delete_messages + [HumanMessage(content=prompts["handoff3"])],
                                    "sender": "handoff"
                                }

                            # ─────────────────────────────────────────────
                            # ROUTER
                            # ─────────────────────────────────────────────

                            def router(state: AgentState):
                                last_msg = state["messages"][-1]
                                sender   = state.get("sender", "")

                                if last_msg.tool_calls:
                                    return "tools"

                                if sender == prompts["sender1"]:
                                    return "handoff_to_agent2"
                                if sender == prompts["sender2"]:
                                    return "handoff_to_agent3"
                                if sender == prompts["sender3"]:
                                    return "handoff_to_agent4"

                                return END

                            # ─────────────────────────────────────────────
                            # GRAPH ASSEMBLY
                            # ─────────────────────────────────────────────

                            tools_node = ToolNode(all_tools)

                            workflow = StateGraph(AgentState)

                            workflow.add_node("agent1",           agent1)
                            workflow.add_node("agent2",           agent2)
                            workflow.add_node("agent3",           agent3)
                            workflow.add_node("agent4",           agent4)
                            workflow.add_node("handoff_to_agent2", handoff_to_agent2)
                            workflow.add_node("handoff_to_agent3", handoff_to_agent3)
                            workflow.add_node("handoff_to_agent4", handoff_to_agent4)
                            workflow.add_node("tools",             tools_node)

                            workflow.add_edge(START, "agent1")

                            workflow.add_conditional_edges(
                                "agent1", router,
                                {"tools": "tools", "handoff_to_agent2": "handoff_to_agent2"}
                            )
                            workflow.add_edge("handoff_to_agent2", "agent2")

                            workflow.add_conditional_edges(
                                "agent2", router,
                                {"tools": "tools", "handoff_to_agent3": "handoff_to_agent3"}
                            )
                            workflow.add_edge("handoff_to_agent3", "agent3")

                            workflow.add_conditional_edges(
                                "agent3", router,
                                {"tools": "tools", "handoff_to_agent4": "handoff_to_agent4"}
                            )
                            workflow.add_edge("handoff_to_agent4", "agent4")

                            workflow.add_conditional_edges(
                                "agent4", router,
                                {"tools": "tools", END: END}
                            )

                            # After any tool call completes, return to whoever called it
                            workflow.add_conditional_edges(
                                "tools",
                                lambda x: x["sender"],
                                {
                                    prompts["sender1"]: "agent1",
                                    prompts["sender2"]: "agent2",
                                    prompts["sender3"]: "agent3",
                                    prompts["sender4"]: "agent4",
                                }
                            )

                            app = workflow.compile()

                            # ─────────────────────────────────────────────
                            # RUN + STREAM
                            # ─────────────────────────────────────────────

                            initial_message = HumanMessage(content=prompts["initial_message"])

                            print("\n\033[1m\033[96m" + "="*50 + f"\nStarting {model_type.title()} Model Audit Pipeline...\n" + "="*50 + "\033[0m\n")

                            async for event in app.astream(
                                {"messages": [initial_message], "sender": "user"},
                                stream_mode="values"
                            ):
                                await asyncio.sleep(2)

                                last_message = event["messages"][-1]
                                sender       = event.get("sender", "SYSTEM").upper()

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
                                    limit   = 350
                                    res_str = str(last_message.content)
                                    if len(res_str) > limit:
                                        res_str = res_str[:limit] + f"\n... [TRUNCATED {len(res_str)-limit} bytes]"
                                    print(f"\n\033[1m\033[94m[TOOL RESULT: {last_message.name}]\033[0m\n{res_str}\n" + "-"*50 + "\n")
                                    ws_content = str(last_message.content)
                                    if len(ws_content) > 2000:
                                        ws_content = ws_content[:2000] + f"\n... [TRUNCATED {len(ws_content)-2000} chars]"
                                    yield {"type": "tool_result", "sender": sender, "name": last_message.name, "content": ws_content}