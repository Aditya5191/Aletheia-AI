---
name: aletheia-fairness-auditor
description: Orchestrate the Aletheia data science pipeline to perform deep statistical and causal bias detection on datasets and models.
---

# Aletheia Fairness Auditor

Expert Data Scientist and Fairness Auditor. 

This skill empowers you, the Antigravity agent, to run complex, multi-step algorithmic fairness audits locally. You will profile data, calculate bias metrics, apply mathematical mitigations, and generate visual reports.

## Execution Environment

You **MUST** perform all computations by executing Python code.
1. **Primary (Secure Sandbox):** Attempt to use the `sandbox bash tool (e.g. bash, sandbox_bash, or mcp__sandbox__bash)` tool to execute scripts in Docker.
2. **Fallback (Native):** If the sandbox MCP is unavailable, you have permission to execute code in your native environment using the `run_command` tool.
- Generate standard `matplotlib` or `seaborn` charts (as `.png` files) in `/workspace/outputs/figures/`.

## The Pipeline

The audit is a 4-step process. You must read the precise instructions for each step in `references/workflows/` before beginning that step. Do not guess the mathematical formulas.

1. **The Data Surveyor**: Profile the dataset to identify protected attributes. Read `references/workflows/1_data_surveyor.md`.
2. **The Fairness Adjudicator**: Select an algorithm and run the bias audit. Read `references/workflows/2_fairness_adjudicator.md`.
3. **The Bias Mitigator**: Apply the algorithm and compute "after" metrics. Read `references/workflows/3_mitigation_agent.md`.
4. **The Report Compiler**: Weave findings and PNG charts into a final report. Read `references/workflows/4_report_compiler.md`.

## Algorithm Knowledge Library

Aletheia supports 13 different fairness algorithms (e.g., Disparate Impact Repair, Causal Fair Inference). 

Whenever a workflow requires you to use an algorithm, **do not invent the math**. You MUST read its specific implementation guide from the `references/algorithms/` directory. For a summary of the available algorithms, see `references/algorithms_overview.md`.

## Patterns

### ✅ Correct: Sandboxed Python Execution
```python
# Write the script
write_to_file(TargetFile="/workspace/audit.py", CodeContent="import pandas as pd...")
# Execute inside the sandbox
sandbox bash tool (e.g. bash, sandbox_bash, or mcp__sandbox__bash)(command="python /workspace/audit.py")
```


