# GEMINI.md - Aletheia Project Context

## Project Overview
**Aletheia** is an advanced Model Context Protocol (MCP) framework designed for automated algorithmic fairness auditing. It enables LLM agents to perform deep statistical and causal bias detection and mitigation on datasets without requiring pre-installed specialized libraries for every algorithm.

The project uses a **Dual-Knowledge Delivery Model** and a **Dual-Backend Architecture**:
- **Auditor MCP Server:** Provides metadata and implementation "knowledge skills" (pseudo-code, math, and tuning guides) for 13 fairness algorithms.
- **Sandbox MCP Server:** Provides a secure, Dockerized Python environment where agents can execute their generated implementation code against user datasets and models.
- **Dual-Backend:** Runs two separate FastAPI instances (`dataset_backend` on 8005, `model_backend` on 8006) with distinct LangGraph flows.

### Core Technologies
- **MCP (Model Context Protocol):** Facilitates communication between agents and tools.
- **LangGraph:** Orchestrates the multi-agent workflows for both Dataset Audits (4 agents) and Model Audits (4 agents).
- **Docker:** Ensures a clean, isolated execution environment for audits.
- **Vertex AI:** Powers the underlying LLM agents (Gemini 1.5 Pro).
- **Python Data Science Stack:** `pandas`, `numpy`, `scipy`, `scikit-learn`, `statsmodels`, `shap`, `torch`, `cvxpy`.

---

## Project Structure
- `agents/`: Contains LangGraph orchestration (`graph.py`) and agent prompts (`prompts/`).
- `mcps/`: Unified MCP servers.
    - `auditor/`: Logic for delivering algorithm knowledge skills.
    - `sandbox/`: Docker-based execution interface.
- `dataset/`: Storage for source data (primary target: `data.csv`).
- `PAPER/`: Original research papers and reference implementations for the 13 algorithms.
- `outputs/`: Directory for generated bias graphs, reports, and audit summaries.
- `main.py`: Entry point for starting the sandbox, MCP servers, and agent pipeline.

---

## Building and Running

### Prerequisites
1. **Docker:** Must be installed and running.
2. **Vertex AI Credentials:** Service account JSON file at `.secrets/vertex-credentials.json`.
3. **Data:** Target dataset must be at `dataset/data.csv`.

### Key Commands
- **Install Dependencies:**
  ```bash
  pip install -r requirements.txt
  ```
- **Build Sandbox Image:**
  ```bash
  docker build -t sandbox-python:latest ./mcps/sandbox
  ```
- **Run Full Audit:**
  ```bash
  python main.py
  ```

---

## Development Conventions

### Agent Workflows
**1. Dataset Pipeline (`dataset_backend`)**
- **Data Surveyor:** Profiles `data.csv`, checks for missing values, identifies column types.
- **Fairness Adjudicator:** Queries `auditor` MCP, loads implementation logic, executes code in sandbox, plots graphs.
- **Bias Mitigator & Report Compiler:** Applies dataset fixes and generates the final PDF.

**2. Model Pipeline (`model_backend`)**
- **Model Inspector:** Loads `.joblib`/`.pkl` and sample data to extract base rates.
- **Behavioral Auditor:** Evaluates prediction disparities and False Positive Rates across cohorts.
- **Threshold Calibrator:** Solves linear programs for Equalized Odds post-processing.
- **Report Compiler:** Generates final model audit PDF.

**3. Interactive Q&A (Chatbot)**
- Both backends feature a `/qa/ask` endpoint that streams natural-language LLM explanations grounded in the agents' generated reports, adjusting its persona based on the active `view_type`.

### Algorithm Types
- **PURE:** Delivered as a single `knowledge.md` containing pseudo-code and math.
- **FRAMEWORK:** Delivered as a YAML DAG (`framework.yaml`) and requires the `framework_scaffold.py` state machine for execution.

### Contribution & Safety
- **Tool Safety:** The `quit_sandbox` tool is explicitly excluded from agent access in `graph.py` to prevent premature container termination.
- **Isolated Execution:** All data-processing code MUST run inside the sandbox container via the `bash` tool.
- **Styling:** Follow existing patterns in `mcps/auditor/` when adding new algorithms (use `knowledge.md` for PURE or `framework.yaml` for complex ones).
