# Lustitia Agentic Bias Detector — Requirements

## 1. Overview

An autonomous multi-agent system built on CrewAI that ingests any tabular dataset
(CSV primary), calls a custom MCP server to retrieve bias-detection algorithm
knowledge, writes and executes all analysis code inside a **llm-sandbox Docker
container**, and produces a full PDF audit report with charts. Every decision the
agent makes — which column is sensitive, which algorithm to run, why — must be
logged and surfaced in the final report.

The sandbox is used for **both profiling and analysis** — no data processing code
runs on the host machine at any point.

---

## 2. Functional Requirements

### 2.1 Data Ingestion & Profiling (in sandbox)
- FR-01  Accept a CSV file path as the single entry-point argument.
- FR-02  The Data Profiler agent writes Python code to profile the CSV and
         executes it inside an llm-sandbox container — not locally.
- FR-03  Profiling code must compute:
           - shape, column dtypes, null percentages
           - value counts and cardinality for categorical columns
           - mean, std, min, max, skew, kurtosis for numeric columns
           - Pearson correlation matrix
           - class distribution of low-cardinality columns
- FR-04  Profiling code must auto-detect candidate sensitive/protected attributes
         by checking column names against a regex list:
         `(gender|sex|race|ethnicity|age|religion|nation|disability|marital)`
         and by flagging any string column with 2–10 unique values.
- FR-05  Profiling code must infer ML task type from dataset structure:
           - 2 unique values in label col → binary_classification
           - 3–20 unique string values → multiclass
           - continuous numeric label → regression
- FR-06  Profiling code must generate at minimum 2 charts:
           - Class distribution bar chart for the label column
           - Correlation heatmap for numeric columns
         Charts are auto-captured by ArtifactSandboxSession via result.plots.
- FR-07  Profiling code prints its full output as a single JSON to stdout.
         The tool reads it from result.stdout.

### 2.2 Algorithm Selection via MCP Server
- FR-08  Connect to the user-supplied MCP server over SSE (URL from env var).
- FR-09  Call `list_algorithms()` to get all available algorithm names.
- FR-10  Call `get_algorithm(name)` for each relevant algorithm to retrieve:
           - description, pseudocode, required inputs, output metrics
- FR-11  Based on dataset profile and task type, the agent autonomously selects
         2–4 algorithms. Decision reasoning must be written to the process log.
- FR-12  If MCP server is unreachable, fall back to a hardcoded minimal set:
         Demographic Parity, Disparate Impact, Equal Opportunity Difference.

### 2.3 Bias Analysis Code Execution (in sandbox)
- FR-13  The Bias Analyst writes Python code to implement each selected algorithm.
- FR-14  All code executes inside an llm-sandbox `ArtifactSandboxSession` container.
- FR-15  The CSV is uploaded to the container before each execution run via
         `session.copy_to_runtime(csv_path, "/sandbox/dataset.csv")`.
- FR-16  Libraries (fairlearn, aif360, shap, etc.) are installed by passing them
         to `session.run(code, libraries=[...])` — not pre-baked into the image.
- FR-17  Bias analysis code must:
           - Load dataset from `/sandbox/dataset.csv`
           - Compute all metrics for the given algorithm
           - Print results as a single JSON to stdout (read from result.stdout)
           - Generate matplotlib/seaborn charts — captured via result.plots
             (ArtifactSandboxSession handles chart extraction automatically)
- FR-18  If `result.exit_code != 0`, the agent reads `result.stderr`, fixes the
         code, and retries. Max 3 attempts per algorithm.
- FR-19  The agent has full autonomy over what code to write and when to open
         a sandbox session. No hardcoded analysis pipeline outside the agent loop.

### 2.4 Report Generation
- FR-20  Final output is a PDF saved to `./reports/<dataset_name>_bias_report.pdf`.
- FR-21  Report must include:
           - Cover page with verdict badge (BIASED / CLEAN / INCONCLUSIVE)
           - Executive summary (plain English)
           - Dataset overview (profile stats in tables)
           - Algorithm selection rationale
           - Per-algorithm findings: metric table + embedded charts
           - Bias verdict summary table: algorithm × col × metric × value × PASS/FAIL
           - Full agent process log appendix
           - Recommendations section
- FR-22  All charts come from `result.plots[i].content_base64` — base64 PNG data
         returned by ArtifactSandboxSession. Decoded and embedded inline in PDF.

### 2.5 Process Transparency
- FR-23  Every tool call logged: tool name, inputs, outputs, timestamp.
- FR-24  Every agent reasoning step captured and stored in process log.
- FR-25  Process log printed to stdout during execution AND embedded in PDF appendix.
- FR-26  Final stdout summary: all tool calls in order, algorithms chosen and why,
         key metrics, report file path.

---

## 3. Non-Functional Requirements

- NFR-01  Docker must be running locally — llm-sandbox uses Docker backend.
- NFR-02  No bias analysis or profiling code runs on the host machine — sandboxed always.
- NFR-03  If a sensitive column cannot be auto-detected, agent prompts via `input()`.
- NFR-04  All secrets from environment variables — never hardcoded.
- NFR-05  Single command entry point: `python crew.py --csv path/to/data.csv`
- NFR-06  Target run time: under 7 minutes for a 10k-row CSV (includes Docker
          container spin-up overhead of ~10–30s per session open).

---

## 4. Constraints & Assumptions

- C-01  Docker must be installed and running on the host machine.
- C-02  The sandbox Docker image `ghcr.io/vndee/sandbox-python-311-bullseye`
        is the default. Can be overridden via SANDBOX_IMAGE env var.
- C-03  Dataset must have at least one column that can serve as a label.
- C-04  MCP server follows standard MCP SSE protocol.
- C-05  No UI in v1 — CLI only. PDF is the sole deliverable.
- C-06  The agent does NOT have a pre-trained model. It either fits a quick
        sklearn model inside the sandbox or uses label columns directly for
        group-level disparity metrics.