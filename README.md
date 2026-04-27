# Aletheia: Fairness Auditing Agent

**Live Demo:** [https://aletheia-frontend-69262873588.us-central1.run.app/](https://aletheia-frontend-69262873588.us-central1.run.app/)
## Quick Start (CLI Pipeline)

Follow these steps to get the full automated multi-agent pipeline running via the terminal:

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Build the Sandbox**:
   ```bash
   # Compiles the clean data-science environment for the agent to use
   docker build -t sandbox-python:latest ./mcps/sandbox
   ```

3. **Configure Secrets**:
   - Place your Google Cloud Vertex AI service account JSON file at:
     `.secrets/vertex-credentials.json`

4. **Add Data**:
   - Place your target dataset at:
     `dataset/data.csv`

5. **Run the Audit**:
   ```bash
   python main.py
   ```

## AgenticFlow Dashboard Setup (Web UI)

If you prefer to use the live React observability dashboard instead of the CLI:

1. **Start the FastAPI Backend**:
   ```bash
   python backend/api.py
   ```
   *Note: The backend orchestrates the agent graph on Port 8000-8002 and serves generated artifacts (charts, code, reports) on **Port 8005**. Ensure the dataset directory exists.*

2. **Start the Frontend**:
   ```bash
   cd frontend/agenticflow
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` in your browser. Drag and drop your CSV dataset, click "Run" on the Data Inspector, and watch the agents execute live!

---

**Aletheia** is a production-ready Model Context Protocol (MCP) server that delivers algorithmic fairness auditing capabilities directly to LLM agents. Instead of exposing rigid API endpoints, the server uses a **Knowledge Skill Delivery Model** -- providing runnable pseudo-code, mathematical specifications, parameter tuning guides, and causal constraints dynamically to any MCP-compatible agent (Claude Desktop, Cursor, LM Studio, or any MCP client).

This allows agents to compile, execute, and sandbox fairness models aligned with user datasets without relying on external web services or pre-built libraries.

The **AgenticFlow Frontend** pairs with this backend to provide a live, real-time forensic observability dashboard powered by WebSocket streaming and LangGraph orchestration.

## Architecture

```
.
├── .secrets/             # Secure credentials (Vertex AI JSON)
├── agents/               # LangGraph Orchestration
│   ├── prompts/          # Externalized Markdown prompts
│   └── graph.py          # Dual-MCP state machine logic
├── backend/              # FastAPI Server (WebSocket Streaming)
│   └── api.py            # Main API serving frontend execution requests
├── dataset/              # Source data (data.csv)
├── frontend/             # AgenticFlow React/Next.js UI
│   └── agenticflow/      # Live dashboard, interactive nodes, deep-dive modal
├── mcps/                 # Unified MCP Servers
│   ├── auditor/          # Aletheia Algorithm Knowledge Delivery
│   ├── sandbox/          # Dockerized Python Execution Environment
│   └── miscellaneous/    # UI Blueprint & Chart Schema Delivery
├── outputs/              # Host-synced bias graphs, JSON charts, and code logs
├── main.py               # CLI entry point
├── Procfile              # Railway deployment config
└── requirements.txt      # Python dependencies
```

### Agent Workflow Diagram

![Agent Workflow Diagram](./USER%20FLOW%20DIAGRAM.png)

## Google Cloud Deployment

Aletheia is deployed as a distributed, production-grade application on Google Cloud. 

### Cloud Architecture

```mermaid
graph TD
    subgraph "Google Cloud"
        direction TB
        
        subgraph "Cloud Run (Serverless)"
            FE[AgenticFlow Frontend\nNext.js standalone]
        end
        
        subgraph "Compute Engine (VM: e2-custom-2-7168 / 7GB)"
            Caddy[Caddy Reverse Proxy\nHTTPS via sslip.io]
            
            subgraph "Backend Container"
                FastAPI[FastAPI WebSocket Server\nPort 8005]
                MCP[LangGraph + MCP Subprocesses]
            end
            
            subgraph "Ephemeral Sandboxes"
                SB1[Docker Sandbox Container 1]
                SB2[Docker Sandbox Container N]
            end
            
            Caddy -->|ws:// / http://| FastAPI
            FastAPI -->|Controls| MCP
            MCP -->|Docker API via Socket| SB1
            MCP -->|Docker API via Socket| SB2
            FastAPI -.->|"docker cp (sync outputs)"| SB1
        end
        
        AR[(Artifact Registry\nus-central1)]
    end
    
    User((User)) -->|HTTPS| FE
    FE -->|WSS / HTTPS| Caddy
    
    AR -.->|Pulls Image| FE
    AR -.->|Pulls Image| FastAPI
```

### Useful Deployment Commands

If you update the code locally and want to push the changes to production, use the following commands:

**1. To deploy Frontend changes:**
```bash
# Build the image with the correct backend URL build args
docker build -t us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/frontend:latest --build-arg NEXT_PUBLIC_API_URL=https://34-46-180-121.sslip.io --build-arg NEXT_PUBLIC_WS_URL=wss://34-46-180-121.sslip.io ./frontend/agenticflow

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/frontend:latest

# Deploy directly to Cloud Run
gcloud run deploy aletheia-frontend --image us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/frontend:latest --region us-central1 --project project-f97facc4-90fc-43df-91f
```

**2. To deploy Backend changes:**
```bash
# Build from the root directory
docker build -t us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/backend:latest -f Dockerfile.backend .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/backend:latest

# SSH into the VM, pull the new image, and restart the container
gcloud compute ssh aletheia-backend --zone=us-central1-a --command="sudo docker pull us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/backend:latest && sudo docker rm -f aletheia-backend && sudo docker run -d --name aletheia-backend --restart=always -p 8005:8005 -v /var/run/docker.sock:/var/run/docker.sock us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/backend:latest"
```

**3. Helpful VM Commands:**
- Check Backend Logs: `gcloud compute ssh aletheia-backend --zone=us-central1-a --command="sudo docker logs aletheia-backend -f"`
- Check if Sandbox Containers are running: `gcloud compute ssh aletheia-backend --zone=us-central1-a --command="sudo docker ps"`

### Agent Roles

| Agent | Purpose | Tools Used |
|-------|---------|------------|
| **Data Surveyor** | Profiles raw data, verifies column types, and checks for missing values or correlations. | Sandbox `bash`, `read_file`, Misc `get_chart_schemas` |
| **Fairness Adjudicator** | Selects the best bias-audit algorithm, writes implementation code, and executes the audit inside the sandbox. | Aletheia `auditor`, Sandbox `bash`, Misc `get_chart_schemas` |
| **Mitigation Agent** | Takes the detected biases and applies algorithms to residualize or remove proxy biases in the dataset. | Aletheia `auditor`, Sandbox `bash` |
| **Report Compiler** | Aggregates all previous findings, dynamically generates HTML/CSS, and uses WeasyPrint to compile a publication-ready PDF report. | Sandbox `bash`, `execute_cell`, `read_file`, `write_file` |

### Dual-Knowledge Delivery Model

The server differentiates between two algorithm delivery types:

| Type | Delivery Format | When Used |
|------|----------------|-----------|
| **PURE** | Single `knowledge.md` file with complete pseudo-code, formulas, and implementation instructions | Algorithms with straightforward mathematical paths (e.g., threshold optimization, BER certification) |
| **FRAMEWORK** | Multi-step `framework.yaml` DAG + `framework_scaffold.py` state machine | Complex pipelines requiring sequential execution with dependencies (e.g., generational tracking, convex optimization) |

### Server Components

```
mcps/auditor/
  server.py               # FastMCP server with tool registry
  framework_scaffold.py   # State-machine executor for FRAMEWORK DAGs
  algo1/knowledge.md      # PURE: Disparate Impact (80% Rule)
  ...
mcps/sandbox/
  Dockerfile              # Clean environment with statsmodels/scipy
  mcp_server.py           # SSE-based Sandbox interface
```

### MCP Tools Exposed

### Aletheia Auditor Tools

| Tool | Purpose |
|------|---------|
| `list_algorithms()` | Returns a JSON menu of all 13 registered algorithms with IDs and names |
| `get_algorithm_info(algorithm_id)` | Returns full metadata: name, type, purpose, sector suitability, and tool schemas. Pass `"all"` for the complete registry |
| `load_algorithm_knowledge(algorithm_id)` | Loads the algorithm's knowledge skill (markdown or YAML+scaffold) directly into the agent's context window |

### Sandbox Execution Tools

| Tool | Purpose |
|------|---------|
| `bash(command)` | Executes shell commands inside the Docker sandbox for data manipulation or setup |
| `execute_cell(code)` | Runs a Jupyter-style Python cell within the Docker sandbox and streams the output |
| `read_file(path)` | Reads a file from the sandbox container |
| `write_file(path, content)` | Writes a completely new file to the sandbox container |
| `edit_file(path, target, replacement)` | Surgically edits specific blocks of code within a file inside the sandbox |
| `grep(pattern, path)` | Searches for text patterns within the sandbox files |
| `list_files(path)` | Lists the contents of a directory in the sandbox |
| `lint_code(path)` | Runs syntax checking on Python files within the sandbox to catch execution errors early |

## Implemented Algorithms

### PURE Algorithms (6)

| ID | Name | Detection | Mitigation | Key Technique |
|----|------|-----------|------------|---------------|
| `disparate_impact_repair` | Disparate Impact (80% Rule) | BER certification against epsilon threshold | Geometric repair via quantile-aligned CDF transformation | Balanced Error Rate, Empirical CDF |
| `equality_of_opportunity` | Equality of Opportunity | TPR/FPR parity measurement across groups | Group-specific threshold optimization via grid search | Equalized Odds, loss-weighted threshold |
| `recidivism_fairness_calibration` | Recidivism Fairness | Impossibility theorem validation (Eq. 2.6) | Explicit tradeoff calibration (FPR/FNR/PPV strategies) | Base rate divergence, penalty disparity |
| `brownian_distance_covariance` | Brownian Distance Covariance | Non-linear proxy detection via dCor with permutation FDR | Non-linear residualization (GBR regression) | Double-centered distance matrices, BH correction |
| `causal_fair_inference` | Causal Fair Inference (PSE) | Path-Specific Effect estimation via IPW with bootstrap CI | Constrained Maximum Likelihood (SLSQP with PSE bounds) | Inverse Probability Weighting, NDE |
| `causal_explanation_formula` | Causal Explanation Formula | Mechanism decomposition: TV = SE + IE - DE | Narrow Tailoring optimization with legal feasibility bounds | Counterfactual direct/indirect/spurious effects |

### FRAMEWORK Algorithms (7)

| ID | Name | Pipeline Steps | Key Technique |
|----|------|---------------|---------------|
| `intersectional_subgroup_scan` | Intersectional Subgroup Scan | 4 steps: Combinatorial generation, DIR + chi-squared, BH FDR, Ranking | Intersectional group fairness, multiple testing correction |
| `mutual_info_proxy_scanner` | Mutual Information Proxy Scanner | 4 steps: KSG MI estimation, Null permutations, FDR correction, Residualization | Information-theoretic dependence, Ridge residuals |
| `shap_proxy_detection` | SHAP Feature Attribution Auditing | 4 steps: Baseline, KernelSHAP, Proxy scoring, Mitigation (reweight/residualize/remove) | Game-theoretic attribution, exponential sample reweighting |
| `counterfactual_orthogonalization` | Counterfactual Fairness (OB) | 3 steps: Correlation audit, SVD orthogonal projection, Matrix reconstruction | Lagrange orthogonalization, SVD decomposition |
| `fairness_feedback_reparation` | Fairness Feedback Loops (MIDS + STAR) | 6 steps: DP, EOdds, AccGap, KL-divergence, Generational tracking, STAR batch sampling | Model-Induced Distribution Shifts, quota-based reparation |
| `dro_fairness_no_demographics` | DRO Fairness Without Demographics | 5 steps: Group risks, Disparity dynamics, Spectral radius, DRO params, Dual SGD training | Chi-squared DRO, Jacobian stability analysis |
| `relational_fairness_psl` | Relational Fairness (FairPSL) | 4 steps: FOL grounding, RD/RR/RC metrics, Linear constraints, Convex MAP inference | First-Order Logic, Probabilistic Soft Logic, CVXPY |

## Sector Suitability Matrix

| Algorithm | Hiring | Finance | Healthcare | Criminal Justice | Education |
|-----------|--------|---------|------------|-----------------|-----------|
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

## Installation

### Dependencies

```bash
pip install mcp numpy pandas scipy scikit-learn statsmodels shap
```

For FRAMEWORK algorithms requiring deep learning (`fairness_feedback_reparation`, `dro_fairness_no_demographics`):

```bash
pip install torch
```

For FRAMEWORK algorithms requiring convex optimization (`relational_fairness_psl`):

```bash
pip install cvxpy
```

### Claude Desktop Integration

Add to `claude_desktop_config.json` (located in `%APPDATA%\Claude`):

```json
{
  "mcpServers": {
    "aletheia-auditor": {
      "command": "python",
      "args": ["C:\\path\\to\\your\\mcps\\auditor\\server.py"]
    },
    "aletheia-sandbox": {
      "command": "python",
      "args": ["C:\\path\\to\\your\\mcps\\sandbox\\mcp_server.py"]
    }
  }
}
```

### Cursor / Generic MCP Client

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "aletheia-auditor": {
      "command": "python",
      "args": ["C:\\path\\to\\your\\mcps\\auditor\\server.py"]
    }
  }
}
```

## Agent Workflow

When an LLM agent connects to this server, the recommended operational sequence is:

1. **Discovery**: Call `list_algorithms()` to see the full menu of available algorithms.
2. **Selection**: Call `get_algorithm_info(algorithm_id)` to read metadata, purpose, and sector suitability for the target algorithm.
3. **Loading**: Call `load_algorithm_knowledge(algorithm_id)` to inject the full implementation knowledge into context.
4. **Implementation**:
   - If **PURE**: Write the detection and mitigation functions directly from the pseudo-code in `knowledge.md`.
   - If **FRAMEWORK**: Follow the DAG steps sequentially, using the `framework_scaffold.py` state machine or implementing the pipeline manually from the YAML specification.
5. **Execution**: Run the implementation against the user's dataset, using the `agent_parameter_tuning_guide` to select appropriate parameter values based on dataset characteristics.

## Knowledge Skill Quality Standards

Every algorithm knowledge file adheres to these standards:

- **Runnable Python pseudo-code** with imports, edge-case handling, and type annotations
- **Full docstrings** with Args and Returns on every function
- **Default parameter values** with dataset-conditional tuning guidance
- **Explicit output specifications** (exact dictionary keys and types returned)
- **Actionable bug warnings** (division-by-zero guards, memory limits, convergence checks)
- **No filler text** -- every line serves a functional purpose for agent implementation

## Research Papers

The `PAPER/` directory contains the original research papers and analysis for each algorithm, including detailed mathematical derivations, bias type analysis, and sector suitability assessments.

## License

This project is provided for academic and research purposes.
