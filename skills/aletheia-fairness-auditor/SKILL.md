---
name: aletheia-fairness-auditor
description: Orchestrate Aletheia Model Context Protocol (MCP) servers to perform deep statistical and causal bias detection. Use when auditing datasets or trained models for fairness, measuring disparate impact, detecting proxies, or mitigating bias.
---

# Aletheia Fairness Auditor

Expert autonomous agent orchestrator for deep algorithmic fairness auditing. 
Aletheia uses a **Dual-Knowledge Delivery Model** via two bundled MCP servers:
1. **Auditor MCP (`mcps/auditor`)**: Provides math, pseudocode, and Directed Acyclic Graphs (DAGs) for 13 fairness algorithms.
2. **Sandbox MCP (`mcps/sandbox`)**: Provides a secure Dockerized Python data science environment.

## When to Activate

- User asks to "audit a dataset for bias"
- User asks to "check fairness of a trained model"
- User asks to calculate Disparate Impact, Equal Opportunity, Demographic Parity, etc.
- User wants to mitigate bias in a dataset or model predictions.

## Agent Orchestration Workflow

When activated, you must logically orchestrate the pipeline exactly as defined by the bundled Agent Prompts in the `agents/` directory.

### 1. Dataset Auditing Pipeline
If the user provides raw data (e.g. `data.csv`), follow the **Dataset Workflow**:
1. **Data Surveyor**: Profile the dataset using the sandbox `bash` tool to find protected attributes and proxies. (Reference: `agents/dataset/data_surveyor.md`)
2. **Fairness Adjudicator**: Query the Auditor MCP for appropriate algorithms. (Reference: `agents/dataset/fairness_adjudicator.md`)
3. **Mitigation Expert**: Execute the mitigation algorithm inside the Sandbox. (Reference: `agents/dataset/mitigation_agent.md`)
4. **Report Compiler**: Generate the final markdown/PDF report. (Reference: `agents/dataset/report_compiler.md`)

### 2. Trained Model Auditing Pipeline
If the user provides model predictions or a trained model, follow the **Model Workflow**:
- Determine if the model is **Classification** or **Regression**.
- Read the corresponding agents in `agents/model/classification/` or `agents/model/regression/`.
- Key steps: Behavioral Auditor -> Model Inspector -> Threshold Calibrator / Output Recalibrator.

## Algorithm Types

Aletheia supports 13 algorithms. Their deep mathematical logic, pseudocode, and framework DAGs are physically bundled in this skill under `references/algorithms/`.

- **PURE algorithms** (e.g., `disparate_impact_repair.md`): Contain pseudocode and math. You must translate this into a python script and run it via `sandbox`.
- **FRAMEWORK algorithms** (e.g., `intersectional_subgroup_scan.yaml`): Contain a DAG. You must write a state-machine scaffold script to execute this.

*For a quick summary of all 13 algorithms, see [references/algorithms_overview.md](references/algorithms.md).*

To implement an algorithm, **DO NOT guess the math**. You MUST read its specific file in `references/algorithms/[algorithm_id].[md|yaml]` first to understand the exact implementation details.

## MCP Tools Setup

Before running the execution workflow, ensure the bundled `sandbox` MCP server is running locally.

| Tool | Purpose |
|------|---------|
| `mcp__sandbox__bash` | Execute Python data science scripts securely in Docker |
| `mcp__sandbox__read_file` | Read generated outputs or source datasets |

## Patterns

### ✅ Correct: Sandboxed Execution
```python
# Always execute data processing scripts securely via the sandbox MCP
response = call_tool("mcp__sandbox__bash", {
    "command": "python /workspace/audit_script.py"
})
```

### ❌ Wrong: Local Execution
```bash
# DO NOT run python directly on the host machine.
python audit_script.py 
```

### ❌ Wrong: Breaking the Sandbox
```python
# DO NOT use the quit_sandbox tool unless explicitly stopping the entire session.
call_tool("mcp__sandbox__quit_sandbox", {}) 
```

## Security & Rules
- **Isolated Execution:** ALL data-processing code MUST run inside the sandbox container via the `bash` tool. Do not analyze datasets directly in the LLM context if they are large.
- **Tool Safety:** The `quit_sandbox` tool is explicitly excluded during active agent phases to prevent premature container termination.
