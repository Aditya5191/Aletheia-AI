# BiasProbe

Pre-deployment, black-box bias testing for LLMs. Gemini 2.5 Pro (Vertex AI)
generates forced-choice comparative scenarios for a use case you describe,
runs them against a target model — Ollama, OpenAI-compatible, Anthropic, or
any arbitrary custom HTTP endpoint — and judges whether the choice tracks a
protected attribute instead of the fixed, non-protected merit facts baked
into each scenario.

This is model-level vetting ("Layer A"), not an audit of a production
system prompt, agent pipeline, or real user traffic — see the disclaimer
printed with every report.

Available two ways: as a standalone CLI (this package), or as the **LLM
BiasProbe** tab in the main Aletheia web app (see
[backend/biasprobe_backend/](../backend/biasprobe_backend/) and the
`BiasProbe*` components in [frontend/agenticflow/components/](../frontend/agenticflow/components/)),
which drives the same pipeline live over a WebSocket with a GUI for
configuring the target endpoint and watching results stream in.

## Why forced-choice, not yes/no

A single-entity "would you approve this one candidate?" prompt has a
ceiling effect — absent any competing candidate or resource constraint, a
model says yes almost regardless of the protected attribute, and bias hides
behind that ceiling. Every scenario BiasProbe generates is instead a
head-to-head choice between two positions, Position A and Position B, where
Position A is pinned to be objectively (if only slightly) stronger on fixed,
non-protected merit facts — a MELD score, years of experience, a quantified
severity — that never change across variants. Only the protected attribute
moves. An unbiased model should pick A every time, in every variant; a
choice that instead tracks which position holds a given attribute value is
the bias signal.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # fill in GCP_PROJECT_ID, etc.
```

Requirements:
- A GCP project with the Vertex AI API enabled, and Application Default
  Credentials (`gcloud auth application-default login`) or a service
  account key referenced by `GOOGLE_APPLICATION_CREDENTIALS`. This powers
  the generator and judge (Gemini) regardless of what target you test.
- Whatever the target needs: Ollama running locally (`ollama serve`) with
  the model pulled, or an API key for a hosted provider, or nothing extra
  for a custom endpoint you already have running.

## Usage

```bash
# Sanity-check connectivity first
python -m biasprobe.cli doctor

# Run a full audit against a local Ollama model
python -m biasprobe.cli run \
  --use-case "An agentic platform that screens resumes and recommends hire/no-hire decisions" \
  --target-model llama3.1:8b \
  --dimensions gender,age,name_ethnicity,disability \
  --num-scenarios 5 \
  --variants-per-dimension 3 \
  --output report.json

# Re-print a saved report
python -m biasprobe.cli report report.json
```

Or, after `pip install -e .`, the `biasprobe` command is available directly
(`biasprobe run ...`, `biasprobe doctor`, `biasprobe report ...`).

The CLI only targets Ollama today (`--target-model`); to test an
OpenAI-compatible, Anthropic, or arbitrary custom HTTP endpoint, use the
**LLM BiasProbe** tab in the web app, which exposes the full
`TargetEndpointConfig` (base URL, model id, API key, and — for custom
endpoints — a request template + response path) through a form with a
"Test Connection" check before committing to a real run.

## Pipeline

1. **Generator** (Gemini, [`scenario_generator.py`](biasprobe/scenario_generator.py))
   — turns the use case into scenario templates. Each `prompt_template`
   contains exactly one `{attribute_a}` and one `{attribute_b}` placeholder,
   with the merit-favoring facts fixed as plain text around them, plus
   per-dimension attribute variants (one marked baseline). Validates the
   generator's output and fails loudly — rather than silently running a
   broken test — if any variant value is blank or a template is missing a
   placeholder.
2. **Counterfactual builder** ([`counterfactual_builder.py`](biasprobe/counterfactual_builder.py))
   — for each scenario+dimension, builds a baseline run (both positions
   neutral) plus, for every non-baseline variant, two swap runs: the tested
   value on Position A, then on Position B. This is what lets the judge
   separate "the model tracks fixed merit facts" from "the model tracks the
   attribute" (and separates that from simple position/order bias).
3. **Target runner** ([`target_runner.py`](biasprobe/target_runner.py)) —
   sends each prompt through a `TargetConnector`
   ([`connectors.py`](biasprobe/connectors.py): Ollama, OpenAI-compatible,
   Anthropic, or a generic custom-HTTP connector built from a request
   template + response path), parses the structured `{"choice": "A"|"B",
   "reasoning": "..."}` it's instructed to return (retries once on parse
   failure, then flags and falls back to judge-only language analysis).
4. **Judge** (Gemini, [`judge.py`](biasprobe/judge.py)) — compares every
   response in a scenario+dimension group side by side, scoring how much
   `choice` tracks the swapped attribute instead of the fixed merit facts,
   and separately flagging language-level bias (differential framing) even
   when the choice itself never flips. Retries on HTTP 429 with exponential
   backoff.
5. **Aggregator** ([`aggregator.py`](biasprobe/aggregator.py)) — rolls
   verdicts into a per-dimension risk rating (thresholds are named
   constants, easy to revisit) and an overall rating.
6. **Report** ([`report.py`](biasprobe/report.py)) — writes the full
   `BiasReport` JSON and prints a CLI summary table plus the
   highest-divergence cases with real prompts/responses.

## Non-goals (v1)

No production system-prompt/agent testing, no real-traffic auditing, no
scheduling, no automated mitigation (`biasprobe mitigate` is a planned
v1.1 that re-runs a dimension's scenarios through a Gemini-generated
mitigation wrapper and reports before/after divergence).

## Tests

```bash
pip install pytest
pytest tests/
```

All tests run against mocked Gemini/HTTP responses — no live API calls or
credits spent.
