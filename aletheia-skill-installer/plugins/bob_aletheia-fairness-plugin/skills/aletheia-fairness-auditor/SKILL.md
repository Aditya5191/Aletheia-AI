---
name: aletheia-fairness-auditor
description: "Orchestrate the Aletheia data science pipeline to perform deep statistical and causal bias detection on datasets and models."
---

# Aletheia Fairness Auditor

Expert Data Scientist and Fairness Auditor.

This skill runs multi-step algorithmic fairness audits: profiling data, calculating bias metrics, applying mathematical mitigations, and generating a full PDF report with charts.

---

## When to Activate

- The user asks to audit a dataset or model for bias.
- The user provides a CSV and asks whether it is fair or biased.
- The user asks you to apply fairness algorithms (e.g. Reweighing, Calibrated Equalized Odds).
- The user asks about disparate impact, protected attributes, or model discrimination.

---

## Step 0 — Determine Execution Mode (MANDATORY FIRST STEP)

You MUST use the Sandbox MCP for this entire audit. Check if the sandbox bash tool is available (`bash`, `sandbox_bash`, `mcp__aletheia-sandbox__bash`, or `mcp__sandbox__bash`). 
Run:
```
echo "sandbox-ok"
```
If it fails or is not available, you MUST halt and inform the user that the Sandbox MCP is missing. DO NOT use native Python or inline Python.

---

## Execution Rules

- **Strict Sandbox Requirement:** You MUST use the sandbox bash tool for all script execution. Write scripts to `/workspace/`, run them via the sandbox tool.
- Save charts as `.png` files using `matplotlib` (backend `Agg`). Do not attempt interactive display.
- Create `/workspace/outputs/figures/` before writing any chart.

---

## The Pipeline

The audit is a 4-step process. Read the workflow document for each step before beginning it. Do not guess or invent mathematical formulas.

1. **Data Surveyor** — Profile the dataset and identify protected attributes. Read `references/workflows/1_data_surveyor.md`.
2. **Fairness Adjudicator** — Select an algorithm and run the bias audit. Read `references/workflows/2_fairness_adjudicator.md`.
3. **Bias Mitigator** — Apply the algorithm and compute post-mitigation metrics. Read `references/workflows/3_mitigation_agent.md`.
4. **Report Compiler** — Compile all findings and charts into a PDF report and markdown summary. Read `references/workflows/4_report_compiler.md`.

---

## Algorithm Knowledge Library

Aletheia supports EXACTLY 13 fairness algorithms. When a workflow instructs you to load an algorithm, read its implementation guide from `references/algorithms/`. 
You MUST ONLY select from these 13 algorithms. Under no circumstances should you invent the mathematics or use external algorithms.

For a summary of all available algorithms, see `references/algorithms_overview.md`.

---

## Output Files

After the pipeline completes, confirm to the user that the following files are available:

| File | Description |
|---|---|
| `final_report.pdf` | Full PDF audit report with embedded charts |
| `agent4.md` | Structured markdown summary of the audit |
| `figures/` | All rendered chart images (.png) |
| `fixed_dataset.csv` | Dataset with mitigated predictions applied |

Copy outputs from the container first:
```bash
docker cp aletheia-sandbox:/workspace/outputs/. ./aletheia-outputs/
```

After successfully copying the files to the host, you MUST call the `quit_sandbox` tool to terminate and delete the sandbox container.
