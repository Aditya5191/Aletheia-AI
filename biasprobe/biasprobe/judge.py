"""Calls Gemini to judge each scenario+dimension group of target responses."""

import json
import os
from collections import defaultdict
from typing import Callable

from . import utils
from .schemas import JudgeVerdict, ScenarioTemplate, TargetResponse

_PROMPT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "prompts",
    "judge_system_prompt.txt",
)

_VALID_SEVERITIES = {"none", "low", "medium", "high"}


def _load_system_prompt() -> str:
    with open(_PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read()


def _group_responses(
    responses: list[TargetResponse],
) -> dict[tuple[str, str], list[TargetResponse]]:
    groups: dict[tuple[str, str], list[TargetResponse]] = defaultdict(list)
    for r in responses:
        groups[(r.scenario_id, r.dimension)].append(r)
    return groups


def _build_user_prompt(
    scenario: ScenarioTemplate | None, dimension: str, group: list[TargetResponse]
) -> str:
    variants_payload = [
        {
            "attribute_a": r.attribute_a,
            "attribute_b": r.attribute_b,
            "tested_value": r.tested_value,
            "tested_position": r.tested_position,
            "raw_response_text": r.raw_response_text,
            "parsed_decision": r.parsed_decision,
        }
        for r in group
    ]
    context = {
        "scenario_id": group[0].scenario_id,
        "dimension": dimension,
        "task_description": scenario.task_description if scenario else "",
        "prompt_template": scenario.prompt_template if scenario else "",
        "variants": variants_payload,
    }
    return json.dumps(context, indent=2)


def _judge_one(
    system_prompt: str, scenario_id: str, dimension: str, group: list[TargetResponse],
    scenario: ScenarioTemplate | None,
) -> JudgeVerdict:
    user_prompt = _build_user_prompt(scenario, dimension, group)
    parsed, _ = utils.call_gemini_json(system_prompt, user_prompt)

    if parsed is None:
        return JudgeVerdict(
            scenario_id=scenario_id,
            dimension=dimension,
            outcome_divergence=0.0,
            language_bias_flags=[],
            verdict_summary=(
                "Judge failed to return parseable JSON for this "
                "scenario+dimension group after a retry; no verdict "
                "could be computed."
            ),
            severity="none",
            judge_parse_failed=True,
        )

    severity = parsed.get("severity", "none")
    if severity not in _VALID_SEVERITIES:
        severity = "none"

    try:
        divergence = float(parsed.get("outcome_divergence", 0.0))
    except (TypeError, ValueError):
        divergence = 0.0
    divergence = max(0.0, min(1.0, divergence))

    return JudgeVerdict(
        scenario_id=scenario_id,
        dimension=dimension,
        outcome_divergence=divergence,
        language_bias_flags=list(parsed.get("language_bias_flags", [])),
        verdict_summary=str(parsed.get("verdict_summary", "")),
        severity=severity,
        judge_parse_failed=False,
    )


def judge_all(
    scenarios: list[ScenarioTemplate],
    responses: list[TargetResponse],
    on_item: Callable[[JudgeVerdict, int, int], None] | None = None,
) -> list[JudgeVerdict]:
    """Judge every scenario+dimension group.

    If given, on_item(verdict, completed_count, total_count) fires after
    each judge call resolves, for streaming progress to a caller.
    """
    system_prompt = _load_system_prompt()
    scenario_by_id = {s.scenario_id: s for s in scenarios}
    groups = _group_responses(responses)
    total = len(groups)

    verdicts: list[JudgeVerdict] = []
    for i, ((scenario_id, dimension), group) in enumerate(groups.items(), start=1):
        scenario = scenario_by_id.get(scenario_id)
        verdict = _judge_one(system_prompt, scenario_id, dimension, group, scenario)
        verdicts.append(verdict)
        if on_item:
            on_item(verdict, i, total)

    return verdicts
