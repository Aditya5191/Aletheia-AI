import asyncio
import os
import json
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, ToolMessage, AIMessage, RemoveMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_google_vertexai import ChatVertexAI, HarmCategory, HarmBlockThreshold
from langgraph.prebuilt import ToolNode
from langchain_core.tools import StructuredTool

from mcp import ClientSession
from mcp.client.sse import sse_client
from langchain_mcp_adapters.tools import load_mcp_tools
from dotenv import load_dotenv

load_dotenv(override=True)

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

def _load_dataset_metadata() -> dict:
    """Read user-supplied dataset description and target column from disk."""
    path = os.path.join("dataset", "metadata.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"description": "", "target_column": ""}


# ── On-demand MCP tool wrapper ──────────────────────────────────────────────
# Instead of holding SSE connections open for the entire audit,
# connect → call → disconnect each time the tool is invoked.

def _create_ondemand_tools(mcp_url: str, tool_schemas: list, label: str) -> list:
    """
    Takes the tool schemas discovered at startup and wraps each one in a
    StructuredTool that opens a fresh SSE connection on every call.
    The connection lives only for the duration of that single tool invocation.
    """
    ondemand_tools = []

    for schema_tool in tool_schemas:
        tool_name = schema_tool.name
        tool_description = schema_tool.description
        tool_args_schema = schema_tool.args_schema

        async def _call_ondemand(url=mcp_url, name=tool_name, lbl=label, **kwargs):
            try:
                async with sse_client(url, timeout=30, sse_read_timeout=60) as (r, w):
                    async with ClientSession(r, w) as session:
                        await session.initialize()
                        tools = await load_mcp_tools(session)
                        target = next((t for t in tools if t.name == name), None)
                        if not target:
                            return f"Error: tool '{name}' not found on {lbl}"
                        return await target.ainvoke(kwargs)
            except Exception as e:
                return f"Error calling {name} on {lbl}: {e}"

        wrapped = StructuredTool.from_function(
            coroutine=_call_ondemand,
            name=tool_name,
            description=tool_description,
            args_schema=tool_args_schema,
        )
        ondemand_tools.append(wrapped)

    return ondemand_tools


async def _discover_tool_schemas(url: str, label: str) -> list:
    """
    Briefly connect to an MCP server, grab its tool list (names + schemas),
    then disconnect. This takes <1 second.
    """
    print(f"[NETWORK] Discovering tools on {label} at {url}...")
    async with sse_client(url, timeout=15, sse_read_timeout=15) as (r, w):
        async with ClientSession(r, w) as session:
            await session.initialize()
            tools = await load_mcp_tools(session)
            print(f"[NETWORK] {label} tools discovered: {[t.name for t in tools]}")
            return tools


async def run_langgraph_agent(
    container_id: str,
    sandbox_url: str = "http://localhost:8000/sse",
    aletheia_url: str = "http://localhost:8001/sse",
    miscellaneous_url: str = "http://localhost:8002/sse"
):
    # ── Step 1: Discover Auditor & Misc tool schemas (brief connect, then disconnect) ──
    auditor_schemas = await _discover_tool_schemas(aletheia_url, "Auditor MCP")
    misc_schemas = await _discover_tool_schemas(miscellaneous_url, "Miscellaneous MCP")

    # ── Step 2: Create on-demand wrappers (no persistent connection) ──
    auditor_tools = _create_ondemand_tools(aletheia_url, auditor_schemas, "Auditor MCP")
    misc_tools = _create_ondemand_tools(miscellaneous_url, misc_schemas, "Miscellaneous MCP")

    # ── Step 3: Only Sandbox MCP stays persistently connected (used constantly) ──
    # Generous timeout — only for Sandbox, which actually needs long-lived SSE
    SANDBOX_TIMEOUT = 600
    SANDBOX_READ_TIMEOUT = 600

    print(f"[NETWORK] Connecting to Sandbox MCP at {sandbox_url} (persistent)...")
    async with sse_client(sandbox_url, timeout=SANDBOX_TIMEOUT, sse_read_timeout=SANDBOX_READ_TIMEOUT) as (sandbox_r, sandbox_w):
        async with ClientSession(sandbox_r, sandbox_w) as sandbox_session:
            await sandbox_session.initialize()
            sandbox_tools = await load_mcp_tools(sandbox_session)
            sandbox_tools = [t for t in sandbox_tools if t.name != "quit_sandbox"]
            print(f"[NETWORK] Sandbox tools loaded: {[t.name for t in sandbox_tools]}")

            all_tools = sandbox_tools + auditor_tools + misc_tools

            # --- Fix additionalProperties Schema Warning ---
            for tool in all_tools:
                if hasattr(tool, "args_schema") and tool.args_schema is not None:
                    if hasattr(tool.args_schema, "model_config"):
                        if isinstance(tool.args_schema.model_config, dict):
                            tool.args_schema.model_config["extra"] = "allow"
                    elif hasattr(tool.args_schema, "Config"):
                        tool.args_schema.Config.extra = "allow"
            # -----------------------------------------------

            creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if creds_path and os.path.exists(creds_path):
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.abspath(creds_path)
                print(f"[AUTH] Using credentials: {os.environ['GOOGLE_APPLICATION_CREDENTIALS']}", flush=True)
            else:
                if "GOOGLE_APPLICATION_CREDENTIALS" in os.environ:
                    os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS")
                print("[AUTH] Using Application Default Credentials (ADC)", flush=True)

            model_name = os.environ.get("VERTEX_MODEL", "gemini-2.0-flash")
            print(f"[LLM] Using model: {model_name}", flush=True)

            llm = ChatVertexAI(
                model=model_name,
                location=os.environ.get("VERTEX_LOCATION", "us-central1"),
                temperature=0.2,
                max_retries=8,
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

            import time

            def data_surveyor(state: AgentState):
                prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "data_surveyor.md")
                with open(prompt_path, "r", encoding="utf-8") as f:
                    raw_prompt = f.read()

                system_prompt = SystemMessage(
                    content=raw_prompt.replace("{container_id}", container_id)
                )
                time.sleep(4.5) # Prevent 15 RPM free tier rate limit
                response = llm_surveyor.invoke([system_prompt] + clean_messages(state["messages"]))
                return {"messages": [response], "sender": "data_surveyor"}

            def fairness_adjudicator(state: AgentState):
                prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "fairness_adjudicator.md")
                with open(prompt_path, "r", encoding="utf-8") as f:
                    raw_prompt = f.read()

                system_prompt = SystemMessage(
                    content=raw_prompt.replace("{container_id}", container_id)
                )
                time.sleep(4.5)
                response = llm_adjudicator.invoke([system_prompt] + clean_messages(state["messages"]))
                return {"messages": [response], "sender": "fairness_adjudicator"}

            def mitigation_agent(state: AgentState):
                prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "mitigation_agent.md")
                with open(prompt_path, "r", encoding="utf-8") as f:
                    raw_prompt = f.read()

                system_prompt = SystemMessage(
                    content=raw_prompt.replace("{container_id}", container_id)
                )
                time.sleep(4.5)
                response = llm_mitigator.invoke([system_prompt] + clean_messages(state["messages"]))
                return {"messages": [response], "sender": "mitigation_agent"}

            def report_compiler(state: AgentState):
                prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "report_compiler.md")
                with open(prompt_path, "r", encoding="utf-8") as f:
                    raw_prompt = f.read()

                system_prompt = SystemMessage(
                    content=raw_prompt.replace("{container_id}", container_id)
                )
                time.sleep(4.5)
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

            metadata = _load_dataset_metadata()
            meta_lines = []
            if metadata.get("description"):
                meta_lines.append(f"Dataset description provided by the user: {metadata['description']}")
            if metadata.get("target_column"):
                meta_lines.append(f"Target variable designated by the user: '{metadata['target_column']}' — treat this as the prediction target throughout the entire audit.")
            meta_context = ("\n\n" + "\n".join(meta_lines)) if meta_lines else ""

            initial_message = HumanMessage(content=f"Please begin the execution. Surveyor, map out the data. Adjudicator, follow up with the fairness audit. Mitigator, follow up with the mitigation. Compiler, follow up with the final report.{meta_context}")

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
