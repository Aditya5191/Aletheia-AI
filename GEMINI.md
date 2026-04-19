# GEMINI.md - Lustitia Project Context

## Project Overview
**Lustitia** is an advanced Model Context Protocol (MCP) framework designed for automated algorithmic fairness auditing. It enables LLM agents to perform deep statistical and causal bias detection and mitigation on datasets without requiring pre-installed specialized libraries for every algorithm.

The project uses a **Dual-Knowledge Delivery Model**:
- **Auditor MCP Server:** Provides metadata and implementation "knowledge skills" (pseudo-code, math, and tuning guides) for 13 fairness algorithms.
- **Sandbox MCP Server:** Provides a secure, Dockerized Python environment where agents can execute their generated implementation code against user datasets.

### Core Technologies
- **MCP (Model Context Protocol):** Facilitates communication between agents and tools.
- **LangGraph:** Orchestrates the multi-agent workflow (Data Surveyor & Fairness Adjudicator).
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

### Agent Workflow
1. **Data Surveyor:** Uses sandbox tools (`bash`, `read_file`) to profile `data.csv`, check for missing values, and identify column types.
2. **Fairness Adjudicator:** 
    - Queries `auditor` MCP for suitable algorithms (`list_algorithms`, `get_algorithm_info`).
    - Loads implementation logic (`load_algorithm_knowledge`).
    - Writes and executes audit code in the sandbox.
    - Generates plots and summaries in `/workspace/outputs/`.

### Algorithm Types
- **PURE:** Delivered as a single `knowledge.md` containing pseudo-code and math.
- **FRAMEWORK:** Delivered as a YAML DAG (`framework.yaml`) and requires the `framework_scaffold.py` state machine for execution.

### Contribution & Safety
- **Tool Safety:** The `quit_sandbox` tool is explicitly excluded from agent access in `graph.py` to prevent premature container termination.
- **Isolated Execution:** All data-processing code MUST run inside the sandbox container via the `bash` tool.
- **Styling:** Follow existing patterns in `mcps/auditor/` when adding new algorithms (use `knowledge.md` for PURE or `framework.yaml` for complex ones).
