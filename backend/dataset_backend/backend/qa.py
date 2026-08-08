"""Read-only Q&A side-channel for the audit pipeline.

Lets a user ask natural-language questions about what an agent has done
(while it's still running, or after it's finished) by reading whatever
outputs/agent{N}.* files currently exist on disk. This never touches the
LangGraph graph, the /ws/audit handler, or the Docker sandbox — it only
reads files that the pipeline has already synced to the host.
"""
import os
import json
from typing import AsyncIterator, Optional

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_ollama import ChatOllama

OUTPUTS_DIR = "outputs"

AGENT_NAMES = {
    1: "Data Surveyor",
    2: "Fairness Adjudicator",
    3: "Mitigation Agent",
    4: "Report Compiler",
}

MODEL_AGENT_NAMES = {
    1: "Model Inspector",
    2: "Behavioral Auditor",
    3: "Threshold Calibrator",
    4: "Report Compiler",
}

MAX_DOC_CHARS = 6000


def _read_text(path: str) -> Optional[str]:
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return None


def _read_json(path: str) -> Optional[dict]:
    raw = _read_text(path)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None


def get_available_agent_context(test_mode: bool = False, view_type: str = "dataset") -> dict:
    """Return per-agent availability + raw content of whatever exists on disk."""
    result = {}
    names = MODEL_AGENT_NAMES if view_type == "model" else AGENT_NAMES
    for num, name in names.items():
        md_path = os.path.join(OUTPUTS_DIR, f"agent{num}.md")
        report = _read_text(md_path)
        metrics = _read_json(os.path.join(OUTPUTS_DIR, f"agent{num}_metrics.json"))
        if test_mode and num in [1, 2]:
            result[num] = {
                "name": name,
                "available": True,
                "report": f"# Mock Report for {name}\n\nIn test mode, {name} analyzed the mock dataset and found that Disparate Impact is 0.72 for unprivileged groups, and the base rate of positive outcomes is heavily skewed.\n\nEverything looks highly biased in this simulation.",
                "metrics": {"disparate_impact": 0.72, "statistical_parity_difference": -0.21}
            }
        else:
            result[num] = {
                "name": name,
                "available": report is not None,
                "report": report,
                "metrics": metrics,
            }
    return result


def build_qa_prompt(question: str, agent_numbers: list[int], context: dict, view_type: str = "dataset") -> list:
    """Build the [SystemMessage, HumanMessage] pair for the Q&A LLM call."""
    sections = []
    for num in agent_numbers:
        info = context.get(num)
        if not info or not info["available"]:
            continue
        header = f"### Agent {num}: {info['name']}"
        body = (info["report"] or "")[:MAX_DOC_CHARS]
        section = f"{header}\n{body}"
        if info.get("metrics"):
            metrics_str = json.dumps(info["metrics"], indent=2)[:2000]
            section += f"\n\n**Metrics:**\n```json\n{metrics_str}\n```"
        sections.append(section)

    if not sections:
        context_text = "(No agent output is available yet for the selected agents.)"
    else:
        context_text = "\n\n---\n\n".join(sections)

    if view_type == "model":
        role_context = "You are the fairness-audit assistant embedded in the Aletheia AI Model Auditor pipeline. Your job is to explain model evaluation metrics, threshold calibration, and prediction disparities."
    else:
        role_context = "You are the fairness-audit assistant embedded in the Aletheia AI Dataset Auditor pipeline. Your job is to explain dataset bias, data transformations, and pre-processing fairness metrics."

    system_text = (
        f"{role_context} "
        "The person asking has NO technical or data-science background. Explain things the "
        "way you'd explain them to a smart friend who has never heard of bias metrics, SHAP, "
        "or statistics — in plain everyday words.\n\n"
        "GROUNDING RULES (critical):\n"
        "- Use ONLY facts, numbers, feature names, and findings that appear in the context below.\n"
        "- Never invent metrics, row values, or names that are not present in the context.\n"
        "- If the context does not contain enough information to answer, say exactly what is "
        "missing (e.g. \"Agent 2's fairness metrics aren't available yet\") instead of guessing.\n"
        "- When you state a number or finding, briefly name which agent's report it came from.\n\n"
        "STYLE RULES (critical):\n"
        "- Be extremely concise. Answer in as few words as truly needed — never pad.\n"
        "- No jargon. If a technical term is unavoidable, define it in 3-5 plain words right next to it.\n"
        "- No throat-clearing, no restating the question, no \"Based on the provided context...\", "
        "no generic disclaimers or caveats unless the data is genuinely missing.\n"
        "- Get straight to the point in the very first sentence.\n\n"
        "FORMATTING RULES:\n"
        "- Respond in clean Markdown.\n"
        "- First line: the direct answer in **one bolded sentence**, in plain English.\n"
        "- Below it, at most 2-4 short bullet points with the supporting specifics (numbers, "
        "names, findings) — skip bullets entirely if the answer is already complete in one line.\n"
        "- Use a small Markdown table only when comparing 3+ numeric values (e.g. rates by group).\n\n"
        "=== AGENT CONTEXT ===\n"
        f"{context_text}"
    )

    return [SystemMessage(content=system_text), HumanMessage(content=question)]


def _build_llm() -> ChatOllama:
    model_name = os.environ.get("QA_OLLAMA_MODEL", "granite4:micro-h")
    base_url = os.environ.get("QA_OLLAMA_URL", "http://localhost:11434")
    return ChatOllama(
        model=model_name,
        base_url=base_url,
        temperature=0.2,
    )


async def stream_answer(question: str, agent_numbers: list[int], test_mode: bool = False, view_type: str = "dataset") -> AsyncIterator[str]:
    context = get_available_agent_context(test_mode=test_mode, view_type=view_type)
    messages = build_qa_prompt(question, agent_numbers, context, view_type=view_type)

    valid_selection = any(
        context.get(n, {}).get("available") for n in agent_numbers
    )
    if not valid_selection:
        yield "No agent output is available yet for the agents you selected. Try again once at least one agent has produced a report."
        return

    llm = _build_llm()
    async for chunk in llm.astream(messages):
        if chunk.content:
            yield chunk.content
