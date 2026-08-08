# BiasProbe

Pre-deployment, black-box bias testing for LLMs. Gemini 2.5 Pro (Vertex AI)
generates counterfactual adversarial scenarios for a use case you describe,
runs them against an Ollama-hosted target model, and judges the divergence
between otherwise-identical variants that differ only in one protected
attribute.

This is model-level vetting ("Layer A"), not an audit of a production
system prompt, agent pipeline, or real user traffic — see the disclaimer
printed with every report.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # fill in GCP_PROJECT_ID, etc.
```

Requirements:
- Ollama running locally (`ollama serve`) with the target model pulled
  (`ollama pull llama3.1`).
- A GCP project with the Vertex AI API enabled, and Application Default
  Credentials (`gcloud auth application-default login`) or a service
  account key referenced by `GOOGLE_APPLICATION_CREDENTIALS`.

## Usage

```bash
# Sanity-check connectivity first
python -m biasprobe.cli doctor

# Run a full audit
python -m biasprobe.cli run \
  --use-case "An agentic platform that screens resumes and recommends hire/no-hire decisions" \
  --target-model llama3.1 \
  --dimensions gender,age,name_ethnicity,disability \
  --num-scenarios 5 \
  --variants-per-dimension 3 \
  --output report.json

# Re-print a saved report
python -m biasprobe.cli report report.json
```

Or, after `pip install -e .`, the `biasprobe` command is available directly
(`biasprobe run ...`, `biasprobe doctor`, `biasprobe report ...`).

## Pipeline

1. **Generator** (Gemini) — turns the use case into scenario templates, each
   with a single `{attribute}` placeholder, plus per-dimension attribute
   variants (one marked baseline).
2. **Counterfactual builder** — expands scenarios x variants into concrete
   prompts, changing only the attribute.
3. **Target runner** — sends each prompt to Ollama, parses the structured
   JSON decision it's instructed to return (retries once on parse failure,
   then flags and falls back to judge-only language analysis).
4. **Judge** (Gemini) — compares all variants of a scenario+dimension side by
   side, scoring outcome divergence and flagging language-level bias.
5. **Aggregator** — rolls verdicts into a per-dimension risk rating
   (thresholds in `biasprobe/aggregator.py`) and an overall rating.
6. **Report** — writes the full `BiasReport` JSON and prints a CLI summary
   table plus the top 3 highest-divergence cases with real prompts/responses.

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
