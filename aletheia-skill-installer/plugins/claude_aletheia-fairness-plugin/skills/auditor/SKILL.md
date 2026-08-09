---
name: aletheia-fairness-auditor
description: Orchestrate the Aletheia data science pipeline to perform deep statistical and causal bias detection on datasets and models. Activate when the user mentions dataset bias, fairness auditing, disparate impact, model calibration, algorithmic fairness, or wants to check if a model discriminates against protected groups — even if they do not use the word "audit".
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

Work through the tiers in order and stop at the first one that succeeds. Inform the user which tier is active before starting Step 1.

### Tier 1 — Sandbox MCP (preferred)

Attempt to call the sandbox bash tool exposed in this session (`bash`, `sandbox_bash`, `mcp__aletheia-sandbox__bash`, or `mcp__sandbox__bash`). Run:
```
echo "sandbox-ok"
```
If it returns `sandbox-ok`, the sandbox MCP is live. Proceed with Tier 1 for all steps.

If the first sandbox tool call times out, the MCP server is likely building the Docker sandbox image in the background (which takes 1-2 minutes). DO NOT halt. Wait 30 seconds and retry the tool call up to 3 times before giving up. If the sandbox tool is not listed in your available tools, or continues to return an error, move to Tier 2.

### Tier 2 — Native Python via shell

Use the Claude built-in `bash` tool (not the sandbox one) to verify Python is available:
```bash
python --version
```
If Python responds, use it for all pipeline steps. Write scripts to `./aletheia-workspace/` using `write_file` and execute them with the `bash` tool. All outputs go to `./aletheia-outputs/`.

**Windows note:** If the bash tool raises a process-creation error (`CreateProcessAsUserW`, exit code 1312, or similar), move to Tier 3.

### Tier 3 — Inline Python (guaranteed fallback)

Execute all audit code as inline Python without any shell. Use `matplotlib` backend `Agg`:
```python
import matplotlib
matplotlib.use('Agg')
```
Save all outputs (charts, markdown, CSV) to `./aletheia-outputs/` using Python's `open()` and `pathlib`. This tier always works.

---

## Execution Rules

- **Tier 1:** Use the sandbox bash tool for all script execution. Write scripts to `/workspace/`, run them via the sandbox tool.
- **Tier 2:** Use the built-in `bash` tool. Write scripts to `./aletheia-workspace/`, run them with `python`.
- **Tier 3:** Execute Python inline. No shell required.
- In all tiers, save charts as `.png` files using `matplotlib`. Do not attempt interactive display.
- Create `./aletheia-outputs/figures/` before writing any chart.

---

## The Pipeline

The audit is a 4-step process. Read the workflow document for each step before beginning it. Do not guess or invent mathematical formulas.

### Step 1 — Data Surveyor
Profile the dataset and identify protected attributes.
Read `references/workflows/1_data_surveyor.md`.

### Step 2 — Fairness Adjudicator
Select an algorithm from the bundled library and run the bias audit.
Read `references/workflows/2_fairness_adjudicator.md`.

### Step 3 — Bias Mitigator
Apply the mitigation algorithm and compute post-mitigation metrics.
Read `references/workflows/3_mitigation_agent.md`.

### Step 4 — Report Compiler
Compile all findings and charts into a PDF report and markdown summary.
Read `references/workflows/4_report_compiler.md`.

---

## Algorithm Knowledge Library

Aletheia supports 13 fairness algorithms. When a workflow instructs you to load an algorithm, read its implementation guide from `references/algorithms/`. Do not invent the mathematics.

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

If running in Tier 1 (sandbox), copy outputs to the host first:
```bash
docker cp aletheia-sandbox:/workspace/outputs/. ./aletheia-outputs/
```
In Tier 2 and Tier 3, files are already on the host at `./aletheia-outputs/`.
