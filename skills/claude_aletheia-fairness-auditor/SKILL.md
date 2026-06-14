---
name: aletheia-fairness-auditor
description: Orchestrate the Aletheia data science pipeline to perform deep statistical and causal bias detection on datasets and models. Make sure to use this skill whenever the user mentions dataset bias, fairness auditing, disparate impact, model calibration, algorithmic fairness, or wants to check if a model discriminates against protected groups, even if they don't explicitly ask for an 'audit'.
---

# Aletheia Fairness Auditor

Expert Data Scientist and Fairness Auditor. 

This skill empowers you to run complex, multi-step algorithmic fairness audits locally. You will profile data, calculate bias metrics, apply mathematical mitigations, and generate visual reports.

## When to Activate

- The user asks to audit a dataset or model for bias.
- Reviewing model predictions for disparate impact.
- The user provides a CSV and asks if it is "fair" or "biased".
- The user asks you to apply fairness algorithms (e.g., Reweighing, Calibrated Equalized Odds).

## The Execution Environment

You **MUST** perform all computations by executing Python code.
1. **Primary (Secure Sandbox):** Attempt to use the `mcp__sandbox__bash` tool to execute scripts in Docker.
2. **Fallback (Native):** If the sandbox MCP is unavailable or Docker is not installed, you have permission to execute code in your native environment using your built-in `bash` tool.
- Generate standard `matplotlib` or `seaborn` charts (as `.png` files) instead of JSON files.

## Progressive Workflow

The audit is a 4-step process. You will assume different specialized roles. **Do not attempt to guess the math or the workflow.** You must read the precise instructions for each role in the `references/workflows/` directory before beginning that step.

### Step 1: The Data Surveyor
Profile the dataset to identify protected attributes and data quality issues.
👉 **Read `references/workflows/1_data_surveyor.md`**

### Step 2: The Fairness Adjudicator
Select an algorithm from the bundled library and run the bias audit.
👉 **Read `references/workflows/2_fairness_adjudicator.md`**

### Step 3: The Bias Mitigator
Apply the selected mitigation algorithm and compute the "after" metrics.
👉 **Read `references/workflows/3_mitigation_agent.md`**

### Step 4: The Report Compiler
Weave the findings and generated PNG charts into a final markdown report.
👉 **Read `references/workflows/4_report_compiler.md`**

## Algorithm Knowledge Library

Aletheia supports 13 different fairness algorithms (e.g., Disparate Impact Repair, Causal Fair Inference). 

Whenever a workflow tells you to load an algorithm's knowledge, **do not invent the math**. You MUST read its specific implementation guide from the `references/algorithms/` directory.

Example: If you select the `disparate_impact_repair` algorithm, read `references/algorithms/disparate_impact_repair.md` to learn how to write the mitigation script.

## Patterns

### ✅ Correct: Sandboxed Python Execution
```python
# Write the script
write_file("/workspace/audit.py", "import pandas as pd...")
# Execute inside the sandbox
mcp__sandbox__bash("python /workspace/audit.py")
```



## References
For a summary of the 13 available algorithms, see `references/algorithms_overview.md`.
