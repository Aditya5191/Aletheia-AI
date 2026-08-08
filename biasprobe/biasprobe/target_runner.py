"""Sends counterfactual prompts to the target model via a TargetConnector."""

from typing import Callable

from . import utils
from .connectors import TargetConnector
from .counterfactual_builder import CounterfactualPrompt
from .schemas import TargetResponse

_REFORMAT_SUFFIX = (
    "\n\nIMPORTANT: Your previous answer did not include valid JSON. "
    "Respond again with ONLY the JSON object described above — no other text, "
    "no markdown fences."
)


def _response_from(
    cf: CounterfactualPrompt, raw_text: str, parsed: dict | None, parse_failed: bool
) -> TargetResponse:
    return TargetResponse(
        scenario_id=cf.scenario_id,
        dimension=cf.dimension,
        attribute_a=cf.attribute_a,
        attribute_b=cf.attribute_b,
        tested_value=cf.tested_value,
        tested_position=cf.tested_position,
        raw_prompt_sent=cf.prompt,
        raw_response_text=raw_text,
        parsed_decision=parsed,
        parse_failed=parse_failed,
    )


def run_target(connector: TargetConnector, cf: CounterfactualPrompt) -> TargetResponse:
    """Query the target model once, retrying once for a parseable JSON decision."""
    raw_text = connector.generate(cf.prompt)
    parsed = utils.extract_json(raw_text)

    if parsed is None:
        raw_text_retry = connector.generate(cf.prompt + _REFORMAT_SUFFIX)
        parsed_retry = utils.extract_json(raw_text_retry)
        if parsed_retry is not None:
            return _response_from(cf, raw_text_retry, parsed_retry, parse_failed=False)
        return _response_from(cf, raw_text, None, parse_failed=True)

    return _response_from(cf, raw_text, parsed, parse_failed=False)


def run_all_targets(
    connector: TargetConnector,
    counterfactuals: list[CounterfactualPrompt],
    on_item: Callable[[TargetResponse, int, int], None] | None = None,
) -> list[TargetResponse]:
    """Run every counterfactual through the target connector.

    If given, on_item(response, completed_count, total_count) fires after
    each call resolves — lets a caller (e.g. a WS handler) stream progress
    without this function knowing anything about how it's consumed.
    """
    total = len(counterfactuals)
    results = []
    for i, cf in enumerate(counterfactuals, start=1):
        response = run_target(connector, cf)
        results.append(response)
        if on_item:
            on_item(response, i, total)
    return results
