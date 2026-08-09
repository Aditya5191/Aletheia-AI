---
name: codex-aletheia-fairness-auditor
description: Orchestrate the Aletheia data science pipeline to perform deep statistical and causal bias detection on datasets and models. Use when auditing datasets or trained models for fairness, measuring disparate impact, detecting proxies, applying fairness algorithms, or generating bias reports.
---

# Aletheia Fairness Auditor

Expert Data Scientist and Fairness Auditor.

This skill runs multi-step algorithmic fairness audits: profiling data, calculating bias metrics, applying mathematical mitigations, and generating a full PDF report with charts.

---

## Step 0 — Determine Execution Mode (MANDATORY FIRST STEP)

You MUST determine which execution mode is available before starting the pipeline. Work through the tiers in order and stop at the first one that succeeds.

### Tier 1 — Sandbox MCP (preferred)

Attempt to call any sandbox tool exposed in this session (`bash`, `sandbox_bash`, `mcp__aletheia-sandbox__bash`, or similar). Run:
```
echo "sandbox-ok"
```
If it returns `sandbox-ok`, the sandbox is available. Proceed with Tier 1 for all pipeline steps.

If the first sandbox tool call times out, the MCP server is likely building the Docker sandbox image in the background (which takes 1-2 minutes). DO NOT halt. Wait 30 seconds and retry the tool call up to 3 times before giving up. If the sandbox MCP tool is **not listed** in your available tools, or the call continues to fail, move to Tier 2.

### Tier 2 — Native Python via shell tool

Use the Codex shell tool (the built-in `shell` or `run_terminal_cmd` available in this session) to run:
```bash
python --version
```
If Python is available, use it for all pipeline steps. Write scripts to `./aletheia-workspace/` and execute them with `python ./aletheia-workspace/script.py`. All outputs go to `./aletheia-outputs/`.

**Windows note:** If the shell tool raises a process-creation error (`CreateProcessAsUserW`, exit code 1312, or similar), this means the Codex runner does not have shell execution rights in this session. Move to Tier 3.

### Tier 3 — Inline Python (guaranteed fallback)

Use the Codex built-in code execution capability to run Python directly without a shell. Write and execute all audit code as inline code blocks. Save outputs (charts, markdown, CSV) to `./aletheia-outputs/` using Python's `open()` and `pathlib`. This mode always works regardless of Docker or shell availability.

**Inform the user which tier is active before starting Step 1.**

---

## Execution Rules (apply to whichever tier is active)

- **Tier 1:** Use the sandbox bash tool for all script execution. Write scripts via `write_file` to `/workspace/`, run them via the sandbox tool.
- **Tier 2:** Use the shell tool for all script execution. Write scripts via `write_file` to `./aletheia-workspace/`, run them with `python`.
- **Tier 3:** Execute Python inline. Use `matplotlib` backend `Agg` (non-interactive, works without a display): `import matplotlib; matplotlib.use('Agg')`.
- In all tiers, save charts as `.png` files. Do not attempt interactive display.
- Create `./aletheia-outputs/figures/` before writing any chart.

---

## The Pipeline

The audit is a 4-step process. Read the workflow document for each step before beginning it. Do not guess or invent mathematical formulas.

1. **Data Surveyor** — Profile the dataset and identify protected attributes. Read [1_data_surveyor.md](references/workflows/1_data_surveyor.md).
2. **Fairness Adjudicator** — Select an algorithm and run the bias audit. Read [2_fairness_adjudicator.md](references/workflows/2_fairness_adjudicator.md).
3. **Bias Mitigator** — Apply the algorithm and compute post-mitigation metrics. Read [3_mitigation_agent.md](references/workflows/3_mitigation_agent.md).
4. **Report Compiler** — Compile all findings and charts into a PDF report and markdown summary. Read [4_report_compiler.md](references/workflows/4_report_compiler.md).

---

## Algorithm Knowledge Library

Aletheia supports 13 fairness algorithms. When a workflow instructs you to load an algorithm, read its implementation guide from `references/algorithms/`. Do not invent the mathematics.

For a summary of all available algorithms, see [algorithms_overview.md](references/algorithms_overview.md).

---

## Output Files

After the pipeline completes, confirm to the user that the following files are available at `./aletheia-outputs/`:

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
