---
name: codex-aletheia-fairness-auditor
description: Orchestrate the Aletheia data science pipeline to perform deep statistical and causal bias detection on datasets and models. Use when auditing datasets or trained models for fairness, measuring disparate impact, detecting proxies, applying fairness algorithms, or generating bias reports.
---

# Aletheia Fairness Auditor

Expert Data Scientist and Fairness Auditor. 

This skill empowers you to run complex, multi-step algorithmic fairness audits locally. You will profile data, calculate bias metrics, apply mathematical mitigations, and generate visual reports.

## Execution Rules

You **MUST** perform all computations by executing Python code.
1. **Primary (Secure Sandbox):** Attempt to use the `mcp__sandbox__bash` tool to execute scripts in Docker.
2. **Fallback (Native):** If the sandbox MCP is unavailable, you have permission to execute code natively using your built-in `bash` or execution environment.
- Generate standard `matplotlib` or `seaborn` charts (as `.png` files) instead of JSON files.

## Progressive Workflow

The audit is a 4-step process. Do not guess the math or the workflow. You must read the precise instructions for each step in `references/workflows/`.

1. **The Data Surveyor**: Profile the dataset to identify protected attributes. See [1_data_surveyor.md](references/workflows/1_data_surveyor.md).
2. **The Fairness Adjudicator**: Select an algorithm and run the bias audit. See [2_fairness_adjudicator.md](references/workflows/2_fairness_adjudicator.md).
3. **The Bias Mitigator**: Apply the algorithm and compute "after" metrics. See [3_mitigation_agent.md](references/workflows/3_mitigation_agent.md).
4. **The Report Compiler**: Weave findings and PNG charts into a final report. See [4_report_compiler.md](references/workflows/4_report_compiler.md).

## Algorithm Knowledge Library

Aletheia supports 13 different fairness algorithms. Whenever a workflow requires you to load an algorithm's knowledge, **do not invent the math**. You MUST read its specific implementation guide from the `references/algorithms/` directory.

For a summary of the available algorithms, see [algorithms_overview.md](references/algorithms_overview.md).
