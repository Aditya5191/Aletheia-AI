<div align="center">

# ALETHEIA AI

### Production-Grade Algorithmic Fairness Auditing via Multi-Agent AI

[![License: Research](https://img.shields.io/badge/License-Research-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-Sandboxed-2496ED.svg?logo=docker&logoColor=white)](https://docker.com)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-Deployed-4285F4.svg?logo=google-cloud&logoColor=white)](https://cloud.google.com)
[![MCP](https://img.shields.io/badge/MCP-Compatible-FF6B35.svg)](https://modelcontextprotocol.io)
[![LangGraph](https://img.shields.io/badge/LangGraph-Orchestrated-7C3AED.svg)](https://langchain-ai.github.io/langgraph)

**[Live Demo](https://aletheia-frontend-69262873588.us-central1.run.app/)**

---

*Most AI fairness tools tell you a number. Aletheia tells you who is being harmed, why, how to fix it, and proves it worked — automatically, end to end, in plain English.*

---

</div>

---

## The Problem

Algorithmic bias is one of the most consequential unsolved problems in applied AI. Criminal justice systems flag innocent people as high-risk at twice the rate for certain racial groups. Hiring models reject qualified candidates based on zip code. Loan systems deny credit using proxies that encode the very discrimination they claim to avoid.

Most organisations know this is happening. Almost none have the tools to prove it, measure it precisely, fix it, and document the fix for regulators — without a dedicated team of ML fairness researchers.

**Aletheia solves this end to end.** Upload a dataset — *or a trained model and a sample of its data* — and get a legally-referenced, plain-English audit report with before/after comparisons, compliance status, and a drop-in fix — fully automated, in minutes.

Aletheia ships **two audit modes**:

- **Dataset Auditor** — upload a CSV. Profiles the data, detects historical bias and proxies, mitigates it, and returns a fixed dataset.
- **Model Auditor** — upload a trained classification or regression model (`.pkl` / `.joblib`) plus a sample CSV. Audits the *model's behaviour* — the groups it disadvantages and the proxies it has internalised — and returns a drop-in fix that needs **no retraining**.

---

## What Makes This Hard (And Why Existing Tools Fall Short)

| Limitation | Existing Tools | Aletheia |
|---|---|---|
| Requires ML expertise to interpret | Yes | No — plain English throughout |
| Detects only surface-level bias | Yes | Detects proxy, intersectional, causal, and indirect bias |
| Static algorithm selection | Yes | Dynamic selection from 13 algorithms per dataset |
| No mitigation | Most | Full mitigation with before/after proof |
| No compliance mapping | No | EEOC, EU AI Act, ISO 24027 |
| No PDF audit trail | No | Publication-ready PDF with charts |
| Requires code changes | Yes | Zero-code — drag, drop, run |

---

## Architecture Overview

Aletheia is a distributed multi-agent system built on three core layers:

```
├── backend/                        # FastAPI WebSocket streaming servers
│   ├── dataset_backend/            # Dataset Auditor  (CSV in → fixed dataset)
│   │   ├── agents/                 #   LangGraph 4-agent graph + Markdown prompts
│   │   └── backend/api.py          #   Streaming API, artifacts on :8005
│   └── model_backend/              # Model Auditor    (trained model in → drop-in fix)
│       ├── agents/                 #   Classification + Regression graphs & prompts
│       └── backend/api.py          #   Streaming API, artifacts on :8006
├── frontend/agenticflow/           # React/Next.js AgenticFlow Dashboard
│   └── components/                 # FlowCanvas + ModelFlowCanvas, deep-dive modal
├── mcps/                           # Shared Model Context Protocol Servers
│   ├── auditor/                    # Algorithm Knowledge Delivery (13 algorithms)
│   ├── sandbox/                    # Dockerized Python Execution Environment
│   └── miscellaneous/              # UI Blueprint and Chart Schema Delivery
├── dataset/                        # Dataset-mode input (data.csv)
├── model_upload/                   # Model-mode input (model.pkl/.joblib + sample.csv)
├── outputs/   ·   model_outputs/   # Host-synced charts, JSON, code logs, PDF reports
├── main.py                         # CLI entry point
├── pytest.ini                      # Test configuration
└── requirements.txt
```

![Agent Workflow](./diagram/USER%20FLOW%20DIAGRAM.png)

### The Dataset Auditor — Four-Agent Pipeline

Each agent is a specialised LLM instance with its own tools, prompt, and responsibility boundary. They communicate via a shared state graph orchestrated by LangGraph.

| Agent | Role | Tools |
|-------|------|-------|
| **Data Surveyor** | Exhaustive EDA — profiles every column, detects proxies, identifies protected attributes, flags data quality issues, selects chart types dynamically | `execute_cell`, `write_file`, `get_chart_schemas` |
| **Fairness Adjudicator** | Selects the optimal algorithm from 13 options, implements it exactly, computes FPR/TPR/DIR/SPD/EOD/FPRD per group, generates plain-English findings | `list_algorithms`, `load_algorithm_knowledge`, `execute_cell`, `get_chart_schemas` |
| **Bias Mitigator** | Applies group-specific calibration or residualization, computes before/after metrics, calculates fairness score improvement, saves fixed dataset | `load_algorithm_knowledge`, `execute_cell`, `write_file` |
| **Report Compiler** | Reads all three agent outputs, generates matplotlib/seaborn charts as PNGs, compiles a full multi-section PDF using ReportLab with tables, compliance status, and executive summary | `execute_cell`, `read_file`, `write_file` |

---

### The Model Auditor — Two Specialised Pipelines

The Model Auditor audits a **trained model directly** instead of a raw dataset. Upload a serialised model (`.pkl` / `.joblib`) and a representative sample CSV, choose **Classification** or **Regression**, and a parallel four-agent pipeline audits the model's *behaviour* — its predictions, the groups it disadvantages, and the proxies it has internalised — then ships a drop-in fix that requires **no retraining**. The same MCP layer (algorithm knowledge, Docker sandbox, chart schemas) powers both modes; the agents differ by task type.

**Classification models**

| Agent | Role |
|-------|------|
| **Model Inspector** | Loads and validates the classifier, generates predictions + probabilities on the sample, computes SHAP feature importance, detects protected attributes and proxy features |
| **Behavioral Auditor** | Selects a fairness algorithm via the MCP, computes per-group PPR/FPR/TPR and DIR/SPD/EOD/FPRD, runs proxy + intersectional detection, and probes the model counterfactually (identical candidate, protected attribute flipped) |
| **Threshold Calibrator** | Derives per-group decision thresholds that equalise the failing fairness metrics, produces a before/after comparison, and emits a drop-in `threshold_map.json` |
| **Report Compiler** | Renders all charts as PNGs and compiles the full PDF report plus the frontend summary |

**Regression models**

| Agent | Role |
|-------|------|
| **Model Profiler** | Loads and validates the regressor, generates predictions, computes SHAP importance (in output units), detects protected attributes and proxies |
| **Disparity Auditor** | Measures systematic over-/under-prediction per group (prediction gap, MPE, MAE, R²), runs proxy + intersectional detection, and probes counterfactually in real units (dollars, points, years) |
| **Output Recalibrator** | Computes per-group output corrections that remove the systematic gap and emits a drop-in `correction_map.json` — applied at inference with no model change |
| **Report Compiler** | Renders all charts as PNGs and compiles the full PDF report plus the frontend summary |

Both pipelines deliver a `fixed_predictions.csv`, a fairness score before/after, compliance status, and a publication-ready PDF — identical in spirit to the Dataset Auditor, but operating on a live model.

---

## The Knowledge Skill Delivery Model

The core technical innovation is the **Aletheia MCP Auditor** — a Model Context Protocol server that delivers algorithm knowledge dynamically to LLM agents rather than hardcoding implementations.

Instead of brittle API calls or pre-built library wrappers, the server injects complete runnable pseudo-code, mathematical specifications, parameter tuning guides, and causal constraints directly into the agent's context window at runtime. The agent then implements the algorithm from first principles inside a sandboxed Docker container.

This means:
- Any new algorithm can be added without touching agent code
- The agent adapts implementation to the specific dataset structure
- No dependency on external fairness libraries that may not fit the data
- Full auditability — the exact implementation is logged and reproducible

### Two Delivery Modes

| Type | Format | When Used |
|------|--------|-----------|
| **PURE** | Single `knowledge.md` — complete pseudo-code, formulas, parameter guides | Algorithms with direct mathematical paths: threshold optimisation, BER certification |
| **FRAMEWORK** | Multi-step `framework.yaml` DAG + `framework_scaffold.py` state machine | Complex sequential pipelines: generational tracking, convex optimisation, causal inference |

---

## The Algorithm Library — 13 Implemented Algorithms

### PURE Algorithms

| ID | Name | Detection Method | Mitigation Technique |
|----|------|-----------------|---------------------|
| `disparate_impact_repair` | Disparate Impact (80% Rule) | BER certification against epsilon threshold | Geometric repair via quantile-aligned CDF transformation |
| `equality_of_opportunity` | Equality of Opportunity | TPR/FPR parity measurement across groups | Group-specific threshold optimisation via grid search |
| `recidivism_fairness_calibration` | Recidivism Fairness Calibration | Impossibility theorem validation (Eq. 2.6) | Explicit tradeoff calibration — FPR/FNR/PPV strategies |
| `brownian_distance_covariance` | Brownian Distance Covariance | Non-linear proxy detection via dCor with permutation FDR | Non-linear residualization via gradient-boosted regression |
| `causal_fair_inference` | Causal Fair Inference (PSE) | Path-Specific Effect estimation via IPW with bootstrap CI | Constrained Maximum Likelihood with SLSQP and PSE bounds |
| `causal_explanation_formula` | Causal Explanation Formula | Mechanism decomposition: TV = SE + IE - DE | Narrow Tailoring optimisation with legal feasibility bounds |

### FRAMEWORK Algorithms

| ID | Name | Pipeline Steps | Core Technique |
|----|------|---------------|----------------|
| `intersectional_subgroup_scan` | Intersectional Subgroup Scan | 4: Combinatorial generation, DIR + chi-squared, BH FDR, Ranking | Intersectional group fairness, multiple testing correction |
| `mutual_info_proxy_scanner` | Mutual Information Proxy Scanner | 4: KSG MI estimation, Null permutations, FDR correction, Residualization | Information-theoretic dependence, Ridge residuals |
| `shap_proxy_detection` | SHAP Feature Attribution Auditing | 4: Baseline, KernelSHAP, Proxy scoring, Mitigation | Game-theoretic attribution, exponential sample reweighting |
| `counterfactual_orthogonalization` | Counterfactual Fairness (OB) | 3: Correlation audit, SVD orthogonal projection, Matrix reconstruction | Lagrange orthogonalization, SVD decomposition |
| `fairness_feedback_reparation` | Fairness Feedback Loops (MIDS + STAR) | 6: DP, EOdds, AccGap, KL-divergence, Generational tracking, STAR batch sampling | Model-Induced Distribution Shifts, quota-based reparation |
| `dro_fairness_no_demographics` | DRO Fairness Without Demographics | 5: Group risks, Disparity dynamics, Spectral radius, DRO params, Dual SGD | Chi-squared DRO, Jacobian stability analysis |
| `relational_fairness_psl` | Relational Fairness (FairPSL) | 4: FOL grounding, RD/RR/RC metrics, Linear constraints, Convex MAP inference | First-Order Logic, Probabilistic Soft Logic, CVXPY |

### Sector Suitability Matrix

| Algorithm | Hiring | Finance | Healthcare | Criminal Justice | Education |
|-----------|:------:|:-------:|:----------:|:----------------:|:---------:|
| `disparate_impact_repair` | Yes | Yes | -- | Yes | -- |
| `equality_of_opportunity` | Yes | Yes | -- | Yes | -- |
| `recidivism_fairness_calibration` | -- | -- | -- | Yes | -- |
| `intersectional_subgroup_scan` | Yes | Yes | Yes | Yes | Yes |
| `mutual_info_proxy_scanner` | Yes | Yes | Yes | -- | Yes |
| `brownian_distance_covariance` | Yes | Yes | Yes | -- | Yes |
| `shap_proxy_detection` | Yes | Yes | Yes | -- | Yes |
| `causal_fair_inference` | Yes | Yes | -- | -- | Yes |
| `counterfactual_orthogonalization` | Yes | Yes | -- | -- | Yes |
| `causal_explanation_formula` | Yes | Yes | -- | -- | Yes |
| `fairness_feedback_reparation` | Yes | Yes | -- | -- | Yes |
| `dro_fairness_no_demographics` | -- | Yes | Yes | -- | Yes |
| `relational_fairness_psl` | Yes | Yes | -- | -- | Yes |

---

## What Aletheia Produces

For every dataset, Aletheia automatically generates:

**For Non-Technical Decision Makers**
- Plain-English verdict: who is harmed, by how much, what the consequence is
- False alarm rate by group with colour-coded severity (red/yellow/green)
- Before vs after comparison showing exactly what improved
- Compliance status against EEOC 4/5ths rule, EU AI Act, ISO 24027
- Overall fairness score (0-100) before and after mitigation
- Recommended next steps in plain English
- Publication-ready PDF audit report with all charts and tables

**For ML and Data Teams**
- Full EDA report with column profiles, correlation analysis, proxy detection
- Exact fairness metrics: DIR, SPD, EOD, FPRD per protected group
- Chi-squared statistical tests with p-values
- Algorithm selection rationale and implementation log
- Fixed dataset CSV with mitigated predictions
- All intermediate agent reports (agent1.md through agent4.md)

**For Compliance and Legal**
- EEOC 4/5ths rule pass/fail before and after
- EU AI Act documentation compliance
- ISO 24027 bias taxonomy documentation
- Full reproducible audit trail across all four agents

**For Model Audits (trained model + sample)**
- SHAP feature importance and proxy attribution for the live model
- Counterfactual evidence — the exact score/output delta from flipping only the protected attribute
- A drop-in `threshold_map.json` (classification) or `correction_map.json` (regression) — apply the fix at inference with no retraining
- `fixed_predictions.csv` with calibrated/corrected outputs, plus the full PDF report

---

## Security and Privacy

- All data processing runs inside an isolated Docker sandbox container — no data leaves the container during analysis
- No dataset content is stored, logged, or transmitted to external services
- The sandbox environment resets between runs — no cross-contamination between audits
- Vertex AI credentials are stored as secrets and never embedded in code or images
- The fixed dataset is written only to the local `/outputs/` directory under explicit user control
- Agent prompts are externalized to Markdown files — fully auditable and version-controlled

---

## Performance and Scalability

- The sandboxed `execute_cell` REPL is persistent within a run — variables stay in memory across cells, avoiding redundant I/O
- All chart generation uses matplotlib with `Agg` backend — no display server required, fully headless
- The FastAPI backend streams agent output via WebSocket — the UI updates in real time without polling
- The four-agent pipeline runs sequentially with shared state — each agent reads only the outputs it needs, minimising token usage
- Google Cloud deployment uses Cloud Run for the frontend (auto-scaling) and a dedicated VM for the backend and sandbox (persistent Docker socket)
- The PDF is compiled server-side using ReportLab — no browser rendering dependency, suitable for CLI-only deployment

---

## The AgenticFlow Dashboard

The frontend is a live forensic observability dashboard built in Next.js with real-time WebSocket streaming.

**Key interface features:**
- **Two workspaces** — switch between the **Workflows** (Dataset Auditor) and **Model Auditor** tabs in the sidebar; each renders its own live agent graph
- **Model upload flow** — a **Classification / Regression** toggle plus drag-and-drop drop zones for the model (`.pkl` / `.joblib`) and its sample CSV
- **Interactive Guided Tour** — a built-in "Show Tour" feature that visually walks users through the entire multi-agent fairness pipeline using mock test data
- **Smart Notifications** — animated, bouncing tooltips that guide users to inspect agent nodes as soon as their tasks are completed
- Drag-and-drop CSV upload with instant dataset preview
- Interactive agent node graph — click any agent to inspect its live output, charts, and code (works identically for dataset and model agents)
- Deep-dive modal per agent showing Analytics, Review, and Code tabs
- **Embedded Graph Explanations** — dynamic contextual explanations beautifully integrated below charts to enhance metric readability without obstructing visuals
- **Scalable Tool Tracing** — a scrollable, robust tool-call log viewer within agent nodes that scales gracefully for long-running pipelines
- Dynamic chart rendering from agent-generated JSON using the chart schema system
- Plain-English findings panel with colour-coded severity (error/warning/success)
- One-click download for the PDF report, fixed CSV / fixed predictions, and the drop-in threshold or correction map

The chart schema system (`get_chart_schemas` MCP tool) ensures the agent always generates JSON that matches exactly what the frontend can render — bar, grouped bar, stacked bar, line, scatter, box plot, heatmap, waterfall — with no hardcoded chart types.

---

## MCP Tools Reference

### Aletheia Auditor Tools

| Tool | Purpose |
|------|---------|
| `list_algorithms()` | Returns a JSON menu of all 13 registered algorithms with IDs and names |
| `get_algorithm_info(algorithm_id)` | Returns full metadata: name, type, purpose, sector suitability, tool schemas. Pass `"all"` for complete registry |
| `load_algorithm_knowledge(algorithm_id)` | Loads the algorithm knowledge skill (Markdown or YAML + scaffold) directly into the agent context window |

### Sandbox Execution Tools

| Tool | Purpose |
|------|---------|
| `bash(command)` | Executes shell commands inside the Docker sandbox |
| `execute_cell(code)` | Runs a Jupyter-style Python cell and streams output |
| `read_file(path)` | Reads a file from the sandbox container |
| `write_file(path, content)` | Writes a new file to the sandbox container |
| `edit_file(path, target, replacement)` | Surgically edits specific blocks within a file |
| `grep(pattern, path)` | Searches for text patterns within sandbox files |
| `list_files(path)` | Lists directory contents in the sandbox |
| `lint_code(path)` | Runs syntax checking on Python files before execution |

---

## Knowledge Skill Quality Standards

Every algorithm knowledge file in the library adheres to:

- Runnable Python pseudo-code with imports, edge-case handling, and type annotations
- Full docstrings with Args and Returns on every function
- Default parameter values with dataset-conditional tuning guidance
- Explicit output specifications — exact dictionary keys and types returned
- Actionable bug warnings — division-by-zero guards, memory limits, convergence checks
- No filler text — every line serves a functional purpose for agent implementation

---

## Quick Start

### CLI Pipeline

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Build the sandbox
docker build -t sandbox-python:latest ./mcps/sandbox

# 3. Configure credentials
# Place your Google Cloud Vertex AI service account JSON at:
# .secrets/vertex-credentials.json

# 4. Add your dataset
# Place your CSV at: dataset/data.csv

# 5. Run the full audit pipeline
python main.py
```

### AgenticFlow Web Dashboard

```bash
# Start the Dataset Auditor backend (MCP servers on 8000-8002, artifacts on 8005)
uvicorn backend.dataset_backend.backend.api:app --host 0.0.0.0 --port 8005

# Start the Model Auditor backend (artifacts on 8006) — run alongside for the Model Auditor tab
uvicorn backend.model_backend.backend.api:app --host 0.0.0.0 --port 8006

# Start the frontend
cd frontend/agenticflow
npm install
npm run dev
# Open http://localhost:3000
```

> The frontend points the Model Auditor tab at the model backend via `NEXT_PUBLIC_MODEL_API_URL` (defaults to `http://localhost:8006`).

---

## Google Cloud Deployment

![Cloud Architecture](./diagram/cloudArtichure.png)

Aletheia runs as a distributed production application on Google Cloud, utilizing Cloud Run for the auto-scaling frontend and two dedicated VMs for the distinct auditing backends to ensure deep isolation and performance.

### 1. Deploy Dataset Auditor Backend
The Dataset Auditor runs on its own VM (`aletheia-dataset-vm`) and serves traffic on port 8005.

```bash
docker build -f Dockerfile.dataset -t us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/backend-dataset:latest .
docker push us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/backend-dataset:latest

gcloud compute ssh aletheia-dataset-vm --zone=us-central1-a --command="\
  sudo docker pull us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/backend-dataset:latest && \
  sudo docker rm -f dataset-backend-api && \
  sudo docker run -d --name dataset-backend-api --restart=always -p 8005:8005 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/backend-dataset:latest"
```

### 2. Deploy Model Auditor Backend
The Model Auditor runs on a separate VM (`aletheia-model-vm`) and serves traffic on port 8006.

```bash
docker build -f Dockerfile.model -t us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/backend-model:latest .
docker push us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/backend-model:latest

gcloud compute ssh aletheia-model-vm --zone=us-central1-a --command="\
  sudo docker pull us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/backend-model:latest && \
  sudo docker rm -f model-backend-api && \
  sudo docker run -d --name model-backend-api --restart=always -p 8006:8006 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/backend-model:latest"
```

### 3. Deploy Frontend (Cloud Run)
The frontend connects to both backends via `sslip.io` DNS mapping to bypass mixed-content and CORS restrictions.

```bash
docker build -t us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/frontend:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://136-116-198-116.sslip.io \
  --build-arg NEXT_PUBLIC_WS_URL=wss://136-116-198-116.sslip.io \
  --build-arg NEXT_PUBLIC_MODEL_API_URL=https://34-136-249-125.sslip.io \
  --build-arg NEXT_PUBLIC_MODEL_WS_URL=wss://34-136-249-125.sslip.io \
  ./frontend/agenticflow

docker push us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/frontend:latest

gcloud run deploy aletheia-frontend \
  --image us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/frontend:latest \
  --region us-central1 \
  --project project-f97facc4-90fc-43df-91f
```

### Useful VM Commands

```bash
# Stream backend logs
gcloud compute ssh aletheia-dataset-vm --zone=us-central1-a --command="sudo docker logs dataset-backend-api -f"
gcloud compute ssh aletheia-model-vm --zone=us-central1-a --command="sudo docker logs model-backend-api -f"

# Check running sandbox containers
gcloud compute ssh aletheia-model-vm --zone=us-central1-a --command="sudo docker ps"
```
---

## Claude Desktop Integration

```json
{
  "mcpServers": {
    "aletheia-auditor": {
      "command": "python",
      "args": ["C:\\path\\to\\mcps\\auditor\\server.py"]
    },
    "aletheia-sandbox": {
      "command": "python",
      "args": ["C:\\path\\to\\mcps\\sandbox\\mcp_server.py"]
    }
  }
}
```

---

## Installation

### Core Dependencies

```bash
pip install mcp numpy pandas scipy scikit-learn statsmodels shap
```

### Deep Learning Algorithms

Required for `fairness_feedback_reparation` and `dro_fairness_no_demographics`:

```bash
pip install torch
```

### Convex Optimisation Algorithms

Required for `relational_fairness_psl`:

```bash
pip install cvxpy
```

---

## Research Foundation

The `PAPER/` directory contains original research papers and mathematical derivations for each algorithm, including bias type analysis, sector suitability assessments, and formal proofs of the fairness properties each algorithm guarantees and the trade-offs it accepts.

---

## Future Roadmap

- **Continuous monitoring** — scheduled re-audits as new data arrives, with drift detection alerting when fairness degrades
- **Multi-dataset comparison** — audit the same model across demographic subpopulations in different geographies
- **Regulatory report templates** — pre-formatted outputs aligned to EEOC, EU AI Act Article 10, and UK Equality Act requirements
- **API-first integration** — submit datasets and retrieve audit reports programmatically for embedding into existing MLOps pipelines
- **Expanded algorithm library** — federated fairness for distributed data, fairness under covariate shift, and longitudinal fairness tracking

---

## License

Provided for academic and research purposes.

---

<div align="center">

Built to make AI systems accountable — to the people they affect, and to the organisations that deploy them.

**[Live Demo](https://aletheia-frontend-69262873588.us-central1.run.app/)**

</div>
