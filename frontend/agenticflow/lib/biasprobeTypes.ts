// Mirrors biasprobe/biasprobe/schemas.py — keep in sync with the backend.

export type EndpointPreset = "openai" | "anthropic" | "ollama" | "custom";

export interface TargetEndpointConfig {
  label: string;
  preset: EndpointPreset;
  base_url: string;
  model_id: string;
  api_key?: string | null;
  method: string;
  headers: Record<string, string>;
  request_template?: string | null;
  response_path?: string | null;
  timeout: number;
}

export interface BiasProbeRunRequest {
  use_case: string;
  endpoint: TargetEndpointConfig;
  dimensions?: string[] | null;
  num_scenarios: number;
  variants_per_dimension: number;
}

export interface ScenarioTemplate {
  scenario_id: string;
  task_description: string;
  prompt_template: string;
  output_instruction: string;
  dimensions_used: string[];
}

export type TestedPosition = "a" | "b" | "baseline";

export interface TargetResponse {
  scenario_id: string;
  dimension: string;
  attribute_a: string;
  attribute_b: string;
  tested_value: string;
  tested_position: TestedPosition;
  raw_prompt_sent: string;
  raw_response_text: string;
  parsed_decision: Record<string, unknown> | null;
  parse_failed: boolean;
}

export interface JudgeVerdict {
  scenario_id: string;
  dimension: string;
  outcome_divergence: number;
  language_bias_flags: string[];
  verdict_summary: string;
  severity: "none" | "low" | "medium" | "high";
  judge_parse_failed: boolean;
}

export interface DimensionSummary {
  dimension: string;
  avg_outcome_divergence: number;
  high_severity_count: number;
  total_cases: number;
  risk_rating: "low" | "medium" | "high";
}

export interface BiasReport {
  use_case: string;
  target_model: string;
  judge_model: string;
  generated_at: string;
  scenarios: ScenarioTemplate[];
  responses: TargetResponse[];
  verdicts: JudgeVerdict[];
  dimension_summaries: DimensionSummary[];
  overall_risk_rating: "low" | "medium" | "high";
  disclaimer: string;
}

export const BIAS_DIMENSION_PRESETS = [
  "gender",
  "age",
  "name_ethnicity",
  "disability",
  "socioeconomic",
];

export interface DecisionDisplay {
  reasoning: string | null;
  badges: { label: string; value: string }[];
  rawFallback: string | null;
}

/**
 * Turns a TargetResponse into something readable: badges for the
 * structured fields (score/recommend/choice/...) and the reasoning text
 * on its own, instead of dumping the raw ```json fenced blob the model
 * actually returned.
 */
export function formatDecisionForDisplay(row: TargetResponse): DecisionDisplay {
  const decision = row.parsed_decision;
  if (decision) {
    const badges: { label: string; value: string }[] = [];
    for (const key of ["score", "recommend", "choice"]) {
      if (decision[key] !== undefined && decision[key] !== null) {
        badges.push({ label: key, value: String(decision[key]) });
      }
    }
    const reasoning = typeof decision.reasoning === "string" ? decision.reasoning : null;
    return { reasoning, badges, rawFallback: reasoning ? null : row.raw_response_text };
  }
  return { reasoning: null, badges: [], rawFallback: row.raw_response_text };
}

export const ENDPOINT_PRESET_DEFAULTS: Record<
  EndpointPreset,
  { base_url: string; model_placeholder: string }
> = {
  openai: { base_url: "https://api.openai.com/v1", model_placeholder: "gpt-4o-mini" },
  anthropic: { base_url: "https://api.anthropic.com/v1", model_placeholder: "claude-sonnet-5" },
  ollama: { base_url: "http://localhost:11434", model_placeholder: "llama3.1:8b" },
  custom: { base_url: "", model_placeholder: "" },
};
