"""Calls Gemini to turn a use-case description into scenarios + attribute variants."""

import os

from . import config, utils
from .schemas import AttributeVariant, ScenarioTemplate

_PROMPT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "prompts",
    "generator_system_prompt.txt",
)


def _load_system_prompt() -> str:
    with open(_PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read()


def generate_scenarios(
    use_case: str,
    dimensions: list[str] | None,
    num_scenarios: int,
    variants_per_dimension: int,
) -> tuple[list[ScenarioTemplate], dict[str, list[AttributeVariant]]]:
    """Ask Gemini for scenarios + per-dimension attribute variants.

    Returns (scenarios, dimension_variants) where dimension_variants maps
    dimension name -> list[AttributeVariant].
    """
    system_prompt = _load_system_prompt()

    dims_line = (
        f"Fixed bias dimensions to test (use ONLY these): {', '.join(dimensions)}"
        if dimensions
        else "No fixed dimensions given — choose the ones most relevant to this use case."
    )

    user_prompt = (
        f"Use case: {use_case}\n"
        f"{dims_line}\n"
        f"num_scenarios: {num_scenarios}\n"
        f"variants_per_dimension: {variants_per_dimension}\n"
    )

    parsed, parse_failed = utils.call_gemini_json(system_prompt, user_prompt)
    if parsed is None:
        raise RuntimeError(
            "Generator: Gemini did not return parseable JSON for scenario "
            "generation, even after a retry."
        )

    raw_scenarios = parsed.get("scenarios", [])
    raw_variants = parsed.get("dimension_variants", {})

    if not raw_scenarios:
        raise RuntimeError("Generator: Gemini returned zero scenarios.")

    scenarios = [ScenarioTemplate(**s) for s in raw_scenarios]

    for s in scenarios:
        if "{attribute_a}" not in s.prompt_template or "{attribute_b}" not in s.prompt_template:
            raise RuntimeError(
                f"Generator: scenario '{s.scenario_id}' is missing a literal "
                f"{{attribute_a}} and/or {{attribute_b}} placeholder in its "
                f"prompt_template — cannot build counterfactual prompts from it."
            )

    dimension_variants: dict[str, list[AttributeVariant]] = {}
    for dim, variants in raw_variants.items():
        parsed_variants = [AttributeVariant(**v) for v in variants]
        if not any(v.is_baseline for v in parsed_variants) and parsed_variants:
            parsed_variants[0].is_baseline = True

        blank = [v for v in parsed_variants if not v.value.strip()]
        if blank:
            raise RuntimeError(
                f"Generator: dimension '{dim}' has a blank attribute value "
                f"(is_baseline={blank[0].is_baseline}) — an empty value collapses "
                f"every counterfactual prompt for this dimension into an identical "
                f"prompt and silently defeats the test. Retry the run; if it "
                f"recurs, the generator prompt needs another look."
            )

        dimension_variants[dim] = parsed_variants

    used_dims = {d for s in scenarios for d in s.dimensions_used}
    missing = used_dims - dimension_variants.keys()
    if missing:
        raise RuntimeError(
            f"Generator: scenarios reference dimensions with no variants: {missing}"
        )

    return scenarios, dimension_variants
