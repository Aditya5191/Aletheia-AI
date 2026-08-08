"""Pydantic data models shared across the BiasProbe pipeline."""

from typing import Literal, Optional

from pydantic import BaseModel


class TargetEndpointConfig(BaseModel):
    label: str = "Target Endpoint"
    preset: Literal["openai", "anthropic", "ollama", "custom"]
    base_url: str
    model_id: str
    api_key: Optional[str] = None  # never logged, never written to disk
    method: str = "POST"
    headers: dict[str, str] = {}
    request_template: Optional[str] = None  # custom preset only, needs literal "{{prompt}}"
    response_path: Optional[str] = None  # custom preset only, e.g. "choices[0].message.content"
    timeout: int = 120


class BiasProbeRunRequest(BaseModel):
    use_case: str
    endpoint: TargetEndpointConfig
    dimensions: Optional[list[str]] = None
    num_scenarios: int = 5
    variants_per_dimension: int = 3


class ScenarioTemplate(BaseModel):
    scenario_id: str
    task_description: str
    # Comparative, forced-choice framing: two entities, Position A pinned as
    # the objectively stronger candidate on non-protected merits (fixed
    # across every variant), Position B pinned weaker. Must contain exactly
    # one literal "{attribute_a}" and one literal "{attribute_b}" placeholder.
    prompt_template: str
    output_instruction: str
    dimensions_used: list[str]


class AttributeVariant(BaseModel):
    dimension: str
    value: str
    is_baseline: bool


class TargetResponse(BaseModel):
    scenario_id: str
    dimension: str
    attribute_a: str  # value substituted into {attribute_a} (Position A, merit-favored)
    attribute_b: str  # value substituted into {attribute_b} (Position B, merit-disfavored)
    tested_value: str  # the non-baseline attribute value under test this run ("" for the baseline run)
    tested_position: Literal["a", "b", "baseline"]
    raw_prompt_sent: str
    raw_response_text: str
    parsed_decision: Optional[dict] = None  # {"choice": "A"|"B", "reasoning": "..."}
    parse_failed: bool = False


class JudgeVerdict(BaseModel):
    scenario_id: str
    dimension: str
    outcome_divergence: float
    language_bias_flags: list[str]
    verdict_summary: str
    severity: Literal["none", "low", "medium", "high"]
    judge_parse_failed: bool = False


class DimensionSummary(BaseModel):
    dimension: str
    avg_outcome_divergence: float
    high_severity_count: int
    total_cases: int
    risk_rating: Literal["low", "medium", "high"]


class BiasReport(BaseModel):
    use_case: str
    target_model: str
    judge_model: str
    generated_at: str
    scenarios: list[ScenarioTemplate]
    responses: list[TargetResponse]
    verdicts: list[JudgeVerdict]
    dimension_summaries: list[DimensionSummary]
    overall_risk_rating: Literal["low", "medium", "high"]
    disclaimer: str = ""
