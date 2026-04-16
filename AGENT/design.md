# Lustitia Agentic Bias Detector — System Design

---

## 1. File Structure

```
bias_agent/
├── llm.py            # LLM definitions only
├── tools.py          # All 4 custom tools
├── agents.py         # 3 CrewAI agents
├── tasks.py          # 3 CrewAI tasks
├── crew.py           # Crew assembly + CLI entry point
├── .env.example
└── requirements.txt
```

---

## 2. Architecture Diagram

```
CLI: python crew.py --csv data.csv
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│                        CrewAI Crew                            │
│                     (sequential flow)                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Agent 1: Data Profiler                                 │  │
│  │  Tool: SandboxTool                                      │  │
│  │  → Writes profiling code                                │  │
│  │  → Runs it in ArtifactSandboxSession (Docker)           │  │
│  │  → Gets: JSON stats (stdout) + charts (result.plots)    │  │
│  └───────────────────────────┬─────────────────────────────┘  │
│                              │ DataProfile (context)           │
│  ┌───────────────────────────▼─────────────────────────────┐  │
│  │  Agent 2: Bias Analyst                                  │  │
│  │  Tools: MCPAlgorithmTool + SandboxTool                  │  │
│  │  → Queries MCP server for algorithm knowledge           │  │
│  │  → Selects 2–4 algorithms + writes analysis code        │  │
│  │  → Runs code in ArtifactSandboxSession (Docker)         │  │
│  │  → Gets: metric JSON (stdout) + charts (result.plots)   │  │
│  │  → Retries on failure (up to 3x per algorithm)          │  │
│  └───────────────────────────┬─────────────────────────────┘  │
│                              │ AnalysisResults (context)       │
│  ┌───────────────────────────▼─────────────────────────────┐  │
│  │  Agent 3: Report Writer                                 │  │
│  │  Tool: PDFReportTool                                    │  │
│  │  → Assembles PDF with all context + charts              │  │
│  │  → Writes process log appendix                          │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
  reports/<name>_bias_report.pdf  +  stdout summary
```

---

## 3. llm-sandbox Integration

### How it Works

`llm-sandbox` runs code inside a Docker container. The relevant class is
`ArtifactSandboxSession` which:

- Spins up a Docker container on `__enter__`
- Accepts `libraries=[...]` per `run()` call — installs them with pip before execution
- Automatically captures matplotlib/seaborn/plotly charts from the container
- Returns charts as `result.plots` — a list of `PlotOutput` objects where
  `plot.content_base64` is base64-encoded PNG data
- Returns stdout, stderr, exit_code in `result`

### Key API Used in This System

```python
from llm_sandbox import ArtifactSandboxSession

with ArtifactSandboxSession(
    lang="python",
    image=os.getenv("SANDBOX_IMAGE", "ghcr.io/vndee/sandbox-python-311-bullseye"),
    verbose=False,
) as session:
    # Upload the CSV into the container
    session.copy_to_runtime(csv_path, "/sandbox/dataset.csv")

    # Run code — installs libraries, executes, captures plots automatically
    result = session.run(
        code=my_python_code,
        libraries=["pandas", "numpy", "matplotlib", "seaborn", "fairlearn"],
        timeout=300,
    )

    # Read outputs
    result.exit_code     # 0 = success
    result.stdout        # whatever the code printed — parse as JSON
    result.stderr        # error message if exit_code != 0
    result.plots         # list[PlotOutput] — charts auto-captured
    result.plots[i].content_base64   # base64 PNG string
    result.plots[i].format.value     # "png"
```

### Important: Charts are Auto-Captured

The agent does NOT need to save charts to files or do any file I/O for plots.
`ArtifactSandboxSession` intercepts all `plt.show()` calls and captures them.
The code just needs to call `plt.show()` after each plot — that's it.

### Important: Results via stdout

The agent writes metric results as JSON to stdout: `print(json.dumps(results))`.
The tool reads them back from `result.stdout`. No file transfer needed for results.

### One Session per Task, Not per Algorithm

Opening a Docker container takes ~10–30 seconds. The `SandboxTool` keeps the
session open across multiple `run()` calls within one tool invocation. Design
the tool to accept a list of code blocks to execute in sequence — not one call
per algorithm. See Tool 1 design below.

---

## 4. File-by-File Design

---

### 4.1 `llm.py`

```python
def get_llm(temperature=0.1) -> LLM      # Data Profiler + Bias Analyst
def get_creative_llm() -> LLM            # Report Writer (temp=0.3)
```

Model: `claude-sonnet-4-20250514`  
Max tokens: `8096`  
API key from: `ANTHROPIC_API_KEY` env var.

---

### 4.2 `tools.py`

Four tools. Each is a `crewai.tools.BaseTool` subclass.

---

#### Tool 1: `SandboxTool`

This is the **single shared tool for ALL code execution** — used by both the
Data Profiler and the Bias Analyst.

```
name:        "run_python_in_sandbox"
description: "Execute Python code securely inside a Docker container using
              llm-sandbox. The CSV file at csv_path is uploaded to
              /sandbox/dataset.csv inside the container before any code runs.
              Charts generated via plt.show() are auto-captured and returned
              as base64 PNG strings. Results should be printed as JSON to stdout.
              Use this for ALL data processing — profiling, analysis, everything.
              Never run data code outside this tool."

Input schema (Pydantic):
  csv_path:    str         → local path to CSV, copied to /sandbox/dataset.csv
  code_blocks: list[str]  → one or more Python scripts to run in sequence
                            (same container, same session — state is preserved)
  libraries:   list[str]  → pip packages to install before first run
  attempt:     int = 1    → retry attempt number (1–3), for logging only

Output (JSON string):
  {
    "runs": [
      {
        "index":     int,          ← which code_block this was
        "success":   bool,         ← exit_code == 0
        "stdout":    str,          ← full stdout (parse this as JSON for results)
        "stderr":    str,          ← non-empty only on failure
        "plots":     [             ← auto-captured charts
          { "index": int, "data_b64": str }
        ]
      }
    ],
    "total_plots": int,
    "attempt": int
  }
```

**Implementation:**

```python
class SandboxTool(BaseTool):
    name: str = "run_python_in_sandbox"
    description: str = "..."

    def _run(self, csv_path: str, code_blocks: list[str],
             libraries: list[str], attempt: int = 1) -> str:

        image = os.getenv("SANDBOX_IMAGE",
                          "ghcr.io/vndee/sandbox-python-311-bullseye")
        runs = []
        plot_index = 0

        with ArtifactSandboxSession(lang="python", image=image,
                                    verbose=False) as session:

            # Upload CSV once, reuse across all code blocks
            session.copy_to_runtime(csv_path, "/sandbox/dataset.csv")

            for i, code in enumerate(code_blocks):
                result = session.run(
                    code=code,
                    libraries=libraries if i == 0 else None,
                    timeout=300,
                    clear_plots=True,   # avoid accumulation between blocks
                )
                plots = []
                for plot in result.plots:
                    plots.append({
                        "index": plot_index,
                        "data_b64": plot.content_base64
                    })
                    plot_index += 1

                runs.append({
                    "index": i,
                    "success": result.exit_code == 0,
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "plots": plots,
                })

                # Stop executing further blocks if one fails
                if result.exit_code != 0:
                    break

        return json.dumps({
            "runs": runs,
            "total_plots": plot_index,
            "attempt": attempt
        })
```

**Notes:**
- `clear_plots=True` on each run prevents plot accumulation between code blocks.
- Libraries only installed on the first `run()` call — they persist in the
  container for subsequent calls in the same session.
- If a `code_block` fails, the loop breaks immediately. The agent reads stderr
  from the relevant run, fixes the code, and calls SandboxTool again.
- Don't catch exceptions inside `_run` — let them propagate so the agent knows
  something at the container level failed (e.g., Docker not running).

---

#### Tool 2: `MCPAlgorithmTool`

```
name:        "get_bias_algorithm_from_mcp"
description: "Query the MCP bias-detection server. action='list' returns all
              available algorithm names. action='get' returns full details
              (description, pseudocode, required inputs, output metrics) for
              a specific algorithm."

Input schema:
  action:         "list" | "get"
  algorithm_name: str | None     ← required only when action="get"

Output (JSON string):
  action="list" →
    { "algorithms": ["DemographicParity", "EqualOpportunity", ...] }

  action="get"  →
    {
      "name": str,
      "description": str,
      "pseudocode": str,
      "required_inputs": {
        "sensitive_col": bool,
        "label_col": bool,
        "predictions": bool,
        "probability_scores": bool
      },
      "output_metrics": [
        { "name": str, "description": str, "threshold": float | null }
      ]
    }
```

**Implementation notes:**

- Connects to `MCP_SERVER_URL` env var via MCP SSE client (`mcp` package).
- MCP client is async. Wrap with `asyncio.run()` inside the synchronous `_run()`.
  If a running event loop is detected (CrewAI async context), fall back to a
  `ThreadPoolExecutor`:

  ```python
  import asyncio, concurrent.futures

  def _run_async(coro):
      try:
          loop = asyncio.get_running_loop()
      except RuntimeError:
          return asyncio.run(coro)
      # Running loop exists — submit to thread pool
      with concurrent.futures.ThreadPoolExecutor() as pool:
          future = pool.submit(asyncio.run, coro)
          return future.result()
  ```

- On connection failure → return fallback:
  ```json
  {
    "algorithms": ["DemographicParity", "DisparateImpact",
                   "EqualOpportunityDifference"],
    "_fallback": true
  }
  ```
  Log the failure but don't crash — the agent can still proceed.

- Module-level cache dict for `list` results (avoid duplicate MCP calls).

---

#### Tool 3: `PDFReportTool`

```
name:        "generate_pdf_report"
description: "Assemble and save a full PDF bias audit report using reportlab."

Input schema:
  output_path:    str
  dataset_name:   str
  profile_json:   str          → JSON string from SandboxTool profiling run
  algo_reasoning: str          → agent's written explanation of algorithm choices
  findings_json:  str          → JSON string: { algo_name: { metric: value } }
  charts_b64:     list[str]    → base64 PNG strings from all sandbox runs
  process_log:    str          → full chronological log of all tool calls
  recommendations: str         → agent-written plain-English recommendations

Output:
  "PDF saved to <path>"   |   "ERROR: <message>"
```

**Report Layout (in order):**

```
1. Cover page
   - Title: "Bias Audit Report"
   - Dataset name, timestamp
   - Verdict badge: ⛔ BIASED (red) / ✅ CLEAN (green) / ⚠️ INCONCLUSIVE (orange)
   - Generated by: Lustitia Agentic Bias Detector

2. Executive Summary
   - 2–3 paragraph plain-English verdict
   - Key findings bullet points

3. Dataset Overview
   - Table: shape, column count, null rates, task type
   - Table: sensitive columns detected, label column
   - Embedded profiling charts (class distribution, correlation heatmap)

4. Algorithm Selection Rationale
   - Which algorithms were chosen and why
   - Which were skipped and why

5. Findings (one subsection per algorithm)
   - Algorithm name + description
   - Metric results table: metric | value | threshold | PASS/FAIL
   - Embedded analysis charts

6. Bias Verdict Summary Table
   - Columns: Algorithm | Sensitive Col | Metric | Value | Status
   - Color coded: red rows = FAIL, green = PASS

7. Recommendations
   - 5–7 concrete, actionable items

8. Appendix A — Full Agent Process Log
   - Every tool call: timestamp | tool | inputs summary | outputs summary
   - Every agent reasoning step
```

**Implementation notes:**
- Use `reportlab.platypus` (`SimpleDocTemplate`, `Table`, `Image`, `Paragraph`,
  `Spacer`).
- Charts: `base64.b64decode(b64_str)` → `io.BytesIO` → `reportlab.platypus.Image`.
- Verdict color: `colors.red`, `colors.green`, `colors.orange` from `reportlab.lib.colors`.
- Synchronous. No async.

---

### 4.3 `agents.py`

Three agents.

---

#### Agent 1: Data Profiler

```python
Agent(
    role="Dataset Profiler and Sensitive Attribute Detector",
    goal="""
        Profile the CSV at {csv_path} by writing Python code and running it
        in the sandbox. The profiling code must:
        - Load /sandbox/dataset.csv
        - Compute full statistical profile (shape, dtypes, nulls, distributions,
          correlations, skew/kurtosis)
        - Detect candidate sensitive columns by name regex and cardinality
        - Infer ML task type from label column
        - Generate: (1) class distribution bar chart, (2) correlation heatmap
          — both via plt.show(), do NOT save to files
        - Print everything as a single JSON to stdout

        Run this code with the run_python_in_sandbox tool.
        Return the full profile JSON plus a 150-word plain-English summary.
    """,
    backstory="""
        You are a data scientist specialized in pre-analysis profiling and
        fairness-aware data assessment. You know which column names signal
        protected attributes, how to infer task types from label distributions,
        and what statistical patterns matter for bias analysis. You always run
        your profiling code in the sandbox — never locally.
    """,
    tools=[SandboxTool()],
    llm=get_llm(),
    verbose=True,
    allow_delegation=False,
    max_iter=5,
)
```

---

#### Agent 2: Bias Analyst

```python
Agent(
    role="Autonomous Bias Analysis Engineer",
    goal="""
        Using the dataset profile from the Data Profiler:

        Step 1 — Algorithm Discovery:
          Use get_bias_algorithm_from_mcp (action=list) then action=get for
          each candidate algorithm. Write your selection reasoning explicitly.

        Step 2 — Code Generation + Execution:
          For each selected algorithm, write Python code that:
          - Loads /sandbox/dataset.csv
          - Implements the algorithm as per the MCP pseudocode
          - Uses fairlearn, aif360, shap as appropriate
          - Computes all output metrics
          - Generates at least 2 charts via plt.show() (group distribution,
            metric comparison) — do NOT save to files
          - Prints all metric results as JSON to stdout

          Run all analysis code blocks in ONE sandbox session call using
          run_python_in_sandbox with code_blocks=[block1, block2, ...].
          Pass all required libraries upfront.

        Step 3 — Retry on Failure:
          If a run's success=False, read stderr, fix the specific code block,
          and call the sandbox again with attempt=2 (then attempt=3 max).

        Step 4 — Compile Results:
          Collect all metric JSONs from stdout + all plots from result.plots.
    """,
    backstory="""
        You are an ML fairness engineer who implements bias metrics from scratch.
        You read algorithm pseudocode and translate it directly to Python.
        You always use the sandbox — never run analysis locally. When code fails
        you read stderr precisely and fix the exact error, not the whole script.
    """,
    tools=[MCPAlgorithmTool(), SandboxTool()],
    llm=get_llm(),
    verbose=True,
    allow_delegation=False,
    max_iter=20,
)
```

---

#### Agent 3: Report Writer

```python
Agent(
    role="Bias Audit Report Writer",
    goal="""
        Using all findings, generate:
        1. A comprehensive PDF report at {report_path} via generate_pdf_report
        2. A stdout summary table showing every tool call, metric, and verdict

        Explain every metric in plain English. Use concrete thresholds
        (Disparate Impact < 0.8 = fail, Demographic Parity Diff > ±0.1 = fail).
        The report must be readable by a non-technical stakeholder.
    """,
    backstory="""
        You are a technical writer specializing in AI audit reports. You translate
        metric values into business-readable verdicts and know standard fairness
        thresholds (EEOC 80% rule, Hardt et al. 2016, AIF360 defaults).
    """,
    tools=[PDFReportTool()],
    llm=get_creative_llm(),
    verbose=True,
    allow_delegation=False,
)
```

---

### 4.4 `tasks.py`

---

#### Task 1: Profile Dataset

```python
Task(
    description="""
        Profile the CSV at: {csv_path}

        Write Python code that does all of the following — then run it with
        run_python_in_sandbox.

        The code must:
          import pandas as pd, numpy as np, matplotlib.pyplot as plt,
                 seaborn as sns, json

          df = pd.read_csv("/sandbox/dataset.csv")

          # 1. Compute all stats (shape, dtypes, nulls, value_counts, corr, skew)
          # 2. Detect sensitive cols via regex on column names + cardinality check
          # 3. Detect label col: binary/low-cardinality cols
          # 4. Infer task type
          # 5. Generate class distribution bar chart → plt.show()
          # 6. Generate correlation heatmap → plt.show()
          # 7. Build a results dict and print(json.dumps(results))

        Pass libraries=["pandas","numpy","matplotlib","seaborn"] to the tool.

        Return:
        - The full JSON from stdout
        - A 150-word plain-English summary of the dataset
        - The base64 chart data from result.plots (for the report)
    """,
    expected_output="""
        Full profiling JSON (shape, columns, stats, sensitive_cols, label_col,
        task_type, warnings) followed by a plain-English summary. Also include
        the base64 chart strings from result.plots so the Report Writer can
        embed them.
    """,
    agent=data_profiler_agent,
)
```

---

#### Task 2: Algorithm Selection + Bias Analysis

```python
Task(
    description="""
        Using the dataset profile from Task 1:

        Step 1 — Query MCP:
          list all algorithms, then get details on the 3–5 most promising ones.
          Write down: why you chose each selected algorithm, why you skipped others.

        Step 2 — Write analysis code for each selected algorithm:
          Each code block must:
            - Load /sandbox/dataset.csv
            - Use the sensitive_col and label_col from the profile
            - Implement the algorithm per MCP pseudocode
            - Install-free — all libs provided upfront
            - Compute all metrics the algorithm produces
            - Generate: group distribution bar chart, metric comparison chart
              (both via plt.show() — NOT saved to files)
            - Print results as: print(json.dumps({"algorithm": name, "metrics": {...}}))

        Step 3 — Execute:
          Call run_python_in_sandbox with:
            csv_path: {csv_path}
            code_blocks: [block_for_algo1, block_for_algo2, ...]
            libraries: ["pandas","numpy","matplotlib","seaborn",
                        "fairlearn","aif360","shap","scikit-learn"]

        Step 4 — Retry if needed:
          For any run with success=False, fix the code and retry (max 3 attempts).

        Step 5 — Compile:
          Parse each run's stdout JSON. Collect all plots from result.plots.
    """,
    expected_output="""
        1. Algorithm selection reasoning
        2. Per-algorithm execution log (attempts, errors fixed)
        3. Per-algorithm metrics: { algo_name: { metric: value, ... } }
        4. All chart base64 strings from result.plots
        5. Preliminary bias verdict with reasoning
    """,
    agent=bias_analyst_agent,
    context=[profile_task],
)
```

---

#### Task 3: Generate Report

```python
Task(
    description="""
        Call generate_pdf_report with:
          output_path:     {report_path}
          dataset_name:    derived from csv filename
          profile_json:    full JSON from Task 1
          algo_reasoning:  algorithm selection reasoning from Task 2
          findings_json:   all metric results from Task 2 as JSON
          charts_b64:      ALL base64 chart strings from Task 1 AND Task 2
          process_log:     chronological log of every tool call across all tasks
                           Format per entry:
                           [timestamp] AGENT: <role>
                           Tool: <tool_name>
                           Input: <brief summary>
                           Output: <brief summary>
                           Decision: <what the agent decided based on this>
          recommendations: write 5–7 specific, actionable recommendations.
                           Be concrete: name the column, the metric, the gap,
                           and a specific mitigation strategy.

        Then print this exact stdout summary:

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FAIRSIGHT BIAS AUDIT COMPLETE
          Dataset: <n>  Rows: <n>  Sensitive: <cols>
          Verdict: ⛔ BIASED | ✅ CLEAN | ⚠️ INCONCLUSIVE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Algorithm          Metric         Value   Status
          ─────────────────────────────────────────────
          <rows>
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Tool calls made: <n>
          Report saved to: <path>
    """,
    expected_output="""
        Confirmation that PDF was saved, the full stdout summary table,
        and the absolute path to the report.
    """,
    agent=report_writer_agent,
    context=[profile_task, analysis_task],
)
```

---

### 4.5 `crew.py`

**Responsibilities:** CLI entry point, ProcessLogger, crew wiring.

```python
# CLI
argparse:
  --csv     PATH    required
  --report  PATH    optional (default: ./reports/<stem>_bias_report.pdf)

# ProcessLogger — hooks into CrewAI step_callback
class ProcessLogger:
    entries: list[dict]   # {timestamp, agent_role, tool_name, input_summary,
                          #  output_summary, decision}
    def log_step(self, step)    → appends to entries
    def as_text(self) -> str    → formatted string for PDF + stdout

# Crew
Crew(
    agents=[data_profiler, bias_analyst, report_writer],
    tasks=[profile_task, analysis_task, report_task],
    process=Process.sequential,
    verbose=True,
    step_callback=process_logger.log_step,
)

# main()
1. Parse args, validate CSV exists
2. mkdir -p ./reports
3. Instantiate ProcessLogger
4. crew.kickoff(inputs={"csv_path": ..., "report_path": ...})
5. Print process_logger.as_text()
```

---

## 5. Data Flow

```
CSV file (host)
    │
    ▼
SandboxTool.copy_to_runtime → /sandbox/dataset.csv (container)
    │
    ├── Profiling code runs → stdout JSON + result.plots (charts)
    │   └── DataProfile context passed to Task 2
    │
    ├── MCPAlgorithmTool → algorithm pseudocode + metadata
    │
    ├── Analysis code blocks run → stdout JSONs + result.plots (charts)
    │   (same container, one session, all libraries installed upfront)
    │
    └── PDFReportTool → PDF assembled on host with reportlab
        ├── Tables from parsed JSON
        ├── Charts from result.plots[i].content_base64 (decoded + embedded)
        └── Process log from ProcessLogger
```

---

## 6. Sandbox Session Strategy

**One session for profiling (Task 1), one session for analysis (Task 2).**

Opening a Docker container is not free (~10–30s). Don't open one per algorithm.
The SandboxTool accepts `code_blocks: list[str]` so the Bias Analyst can run
all algorithm code in a single session, with libraries installed once on the
first `run()` call.

```
Task 1: SandboxTool called once
  Session 1 opens
    copy_to_runtime(csv, /sandbox/dataset.csv)
    run(profiling_code, libraries=[...], clear_plots=True)
      → result.stdout → profile JSON
      → result.plots  → profiling charts (dist + heatmap)
  Session 1 closes

Task 2: SandboxTool called once (all algorithms in one session)
  Session 2 opens
    copy_to_runtime(csv, /sandbox/dataset.csv)
    run(algo1_code, libraries=[...], clear_plots=True)
      → result.stdout → algo1 metrics JSON
      → result.plots  → algo1 charts
    run(algo2_code, libraries=None, clear_plots=True)
      → result.stdout → algo2 metrics JSON
      → result.plots  → algo2 charts
    ...
  Session 2 closes
```

If a code block fails, the agent calls SandboxTool **again** with the fixed
code block list (attempt=2). This reopens the container — acceptable for a
retry scenario.

---

## 7. Error Handling Strategy

| Failure Point                | Strategy                                                  |
|------------------------------|-----------------------------------------------------------|
| CSV not found                | Raise immediately in crew.py before kickoff               |
| Docker not running           | SandboxTool exception propagates → agent sees error msg   |
| No sensitive col detected    | Agent prompts via `input()` in task description           |
| MCP server unreachable       | MCPAlgorithmTool returns hardcoded fallback list          |
| Code block fails (attempt 1–2)| Agent reads stderr, patches specific block, retries      |
| Code block fails (attempt 3) | Skip algorithm, mark as "execution failed" in report     |
| No charts generated          | PDF skips chart sections gracefully                       |
| PDF write fails              | Print full findings JSON to stdout as fallback           |

---

## 8. Key Design Decisions

**Why SandboxTool is shared between Data Profiler and Bias Analyst?**
Both agents need to run Python code in isolation. A shared tool avoids code
duplication and means both agents get the same sandboxed execution guarantees.
The profiling code is just as untrusted as the analysis code.

**Why `code_blocks: list[str]` instead of one string per call?**
Docker container startup is the bottleneck (~10–30s). Running all algorithm
code blocks in a single session — with libraries installed once — keeps total
runtime reasonable. If each algorithm needed its own `SandboxTool` call, you'd
pay the startup cost N times.

**Why stdout JSON instead of writing to files in the container?**
`result.stdout` is directly available on `SandboxTool._run()` return.
`copy_from_runtime()` would require a known file path, error handling for missing
files, and adds complexity. Printing JSON to stdout is simpler and works perfectly
for structured results under ~1MB.

**Why charts are NOT saved by the code?**
`ArtifactSandboxSession` auto-captures any `plt.show()` call into `result.plots`.
This is cleaner than having the agent write `plt.savefig(...)` code, avoids
path management inside the container, and means the agent can't accidentally
skip saving a chart.

**Why reportlab over WeasyPrint?**
Zero system dependencies — pure Python. WeasyPrint requires system Cairo/Pango
libs. For a portable dev tool, pure Python wins.

**Why sequential crew, not hierarchical?**
Strict data dependencies: profiling → algorithm selection → reporting.
A manager agent adds non-determinism without benefit here.

---

## 9. Bias Metric Thresholds

Baked into Report Writer agent instructions:

| Metric                        | Threshold       | Source              |
|-------------------------------|-----------------|---------------------|
| Demographic Parity Difference | > ±0.10 = FAIL  | Fairlearn default   |
| Disparate Impact Ratio        | < 0.80 = FAIL   | EEOC 80% rule       |
| Equal Opportunity Difference  | > ±0.10 = FAIL  | Hardt et al. 2016   |
| Average Odds Difference       | > ±0.10 = FAIL  | AIF360 default      |
| Theil Index                   | > 0.20 = FAIL   | AIF360 default      |
| Statistical Parity Difference | > ±0.10 = FAIL  | AIF360 default      |

---

## 10. Environment Variables

| Variable           | Required | Description                                       |
|--------------------|----------|---------------------------------------------------|
| ANTHROPIC_API_KEY  | Yes      | Claude API key                                    |
| MCP_SERVER_URL     | Yes*     | SSE URL of your MCP bias-algorithm server         |
| SANDBOX_IMAGE      | No       | Docker image (default: vndee/sandbox-python-311)  |
| REPORT_OUTPUT_DIR  | No       | Default: ./reports                                |

*Falls back to hardcoded algorithm list if not set or unreachable.

**Prerequisite:** Docker must be running locally before `python crew.py` is invoked.

---

## 11. Expected stdout (Sample)

```
[DATA PROFILER] run_python_in_sandbox
  → csv_path=data/adult_income.csv, 1 code block, libraries=[pandas,numpy,...]
  → success=True, 2 charts captured
  → Profile: 48842 rows, 15 cols, sensitive=['race','sex'], label='income',
              task=binary_classification

[BIAS ANALYST] get_bias_algorithm_from_mcp (list)
  → 6 algorithms available

[BIAS ANALYST] get_bias_algorithm_from_mcp (get DemographicParity)
[BIAS ANALYST] get_bias_algorithm_from_mcp (get DisparateImpact)
[BIAS ANALYST] get_bias_algorithm_from_mcp (get EqualOpportunity)
  → Selected: DemographicParity, DisparateImpact, EqualOpportunityDifference
  → Skipped:  CalibratedEqOdds (needs probability scores — no model)
              IndividualFairness (needs feature similarity metric)

[BIAS ANALYST] run_python_in_sandbox (attempt 1)
  → 3 code blocks, all 6 libraries installed upfront
  → Run 0 (DemographicParity): success, 2 charts
  → Run 1 (DisparateImpact): success, 2 charts
  → Run 2 (EqualOpportunity): success, 2 charts
  → Total: 6 charts captured

[REPORT WRITER] generate_pdf_report
  → 8 charts embedded, 28-page PDF...
  → Saved: reports/adult_income_bias_report.pdf

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FAIRSIGHT BIAS AUDIT COMPLETE
  Dataset: adult_income  Rows: 48842  Sensitive: race, sex
  Verdict: ⛔ BIASED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Algorithm              Metric          Value    Status
  ─────────────────────────────────────────────────────
  DemographicParity      DP Diff (sex)   -0.194   ❌ FAIL
  DemographicParity      DP Diff (race)  -0.233   ❌ FAIL
  DisparateImpact        DI Ratio (sex)   0.362   ❌ FAIL
  DisparateImpact        DI Ratio (race)  0.449   ❌ FAIL
  EqualOpportunity       EOD (sex)       -0.121   ❌ FAIL
  EqualOpportunity       EOD (race)      -0.089   ✅ PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Tool calls made: 6  |  Report: reports/adult_income_bias_report.pdf
```