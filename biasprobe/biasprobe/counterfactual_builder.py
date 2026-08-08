"""Expands scenario templates x attribute variants into concrete forced-choice prompts.

For each scenario+dimension, produces:
  - one baseline run (both positions hold the dimension's neutral value)
  - for every non-baseline variant value V: two swap runs — V on Position A
    (with B held at baseline), and V on Position B (with A held at baseline)

Position A is always the merit-favored one per the scenario template; only
the protected attribute moves between runs. This lets the judge separate
"the model tracks fixed merit facts" from "the model tracks the attribute".
"""

from dataclasses import dataclass

from .schemas import AttributeVariant, ScenarioTemplate


@dataclass
class CounterfactualPrompt:
    scenario_id: str
    dimension: str
    attribute_a: str
    attribute_b: str
    tested_value: str  # "" for the baseline run
    tested_position: str  # "a" | "b" | "baseline"
    prompt: str


def _fill(scenario: ScenarioTemplate, attribute_a: str, attribute_b: str) -> str:
    filled = scenario.prompt_template.replace("{attribute_a}", attribute_a).replace(
        "{attribute_b}", attribute_b
    )
    return f"{filled}\n\n{scenario.output_instruction}"


def build_counterfactuals(
    scenarios: list[ScenarioTemplate],
    dimension_variants: dict[str, list[AttributeVariant]],
) -> list[CounterfactualPrompt]:
    prompts: list[CounterfactualPrompt] = []

    for scenario in scenarios:
        for dimension in scenario.dimensions_used:
            variants = dimension_variants.get(dimension, [])
            if not variants:
                continue
            baseline = next((v for v in variants if v.is_baseline), None)
            baseline_value = baseline.value if baseline else ""
            non_baseline = [v for v in variants if not v.is_baseline]

            prompts.append(
                CounterfactualPrompt(
                    scenario_id=scenario.scenario_id,
                    dimension=dimension,
                    attribute_a=baseline_value,
                    attribute_b=baseline_value,
                    tested_value="",
                    tested_position="baseline",
                    prompt=_fill(scenario, baseline_value, baseline_value),
                )
            )

            for variant in non_baseline:
                prompts.append(
                    CounterfactualPrompt(
                        scenario_id=scenario.scenario_id,
                        dimension=dimension,
                        attribute_a=variant.value,
                        attribute_b=baseline_value,
                        tested_value=variant.value,
                        tested_position="a",
                        prompt=_fill(scenario, variant.value, baseline_value),
                    )
                )
                prompts.append(
                    CounterfactualPrompt(
                        scenario_id=scenario.scenario_id,
                        dimension=dimension,
                        attribute_a=baseline_value,
                        attribute_b=variant.value,
                        tested_value=variant.value,
                        tested_position="b",
                        prompt=_fill(scenario, baseline_value, variant.value),
                    )
                )

    return prompts
