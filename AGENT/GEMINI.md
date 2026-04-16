# Lustitia Agentic Bias Detector: Instructional Context

## Project Overview
Lustitia is an autonomous, multi-agent system designed to detect and audit bias in tabular datasets (CSVs). Built on the **CrewAI** framework, it orchestrates specialized agents to profile data, select appropriate fairness algorithms from a custom **Model Context Protocol (MCP)** server, and execute analysis code within a secure **Docker sandbox**.

### Core Architecture
- **Multi-Agent Workflow**: Sequential process involving a Data Profiler, Bias Analyst, and Report Writer.
- **Secure Execution**: All data profiling and bias analysis code runs inside an `llm-sandbox` Docker container, ensuring no untrusted code executes on the host machine.
- **Dynamic Knowledge**: A custom MCP server (`Lustitia/MCP/server.py`) provides agents with algorithmic "knowledge" (pseudocode and mathematical bounds) rather than static implementations.
- **Automated Reporting**: Generates a professional PDF audit report with statistical summaries, visualizations, and actionable recommendations.

## Key Technologies
- **Agentic Framework**: CrewAI, crewai-tools
- **LLMs**: Custom LM Studio instance hosted via Dev Tunnels (`https://7x73n9pq-1234.inc1.devtunnels.ms/v1`). Uses the `openai/gpt-oss-20b` model and follows the OpenAI response format.
- **Sandbox**: `llm-sandbox` using Docker backend.
- **Data Stack**: Pandas, Numpy, Scikit-learn, Fairlearn, AIF360, SHAP, Seaborn, Matplotlib (installed dynamically in the sandbox).
- **Communication**: MCP (SSE-based), Pydantic (for tool schemas).
- **Reporting**: ReportLab for PDF generation.

## Building and Running

### Prerequisites
- **Python 3.10.9** recommended.
- **Docker** must be installed and running locally for the execution sandbox.
- **MCP Server** access (local or remote).

### Setup
1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Environment Variables**: Create a `.env` file (see `.env.example`):
   - `GROQ_API_KEY`: Required for LLM access.
   - `MCP_SERVER_URL`: URL to the running Lustitia MCP server (e.g., `http://localhost:8000/sse`).
   - `SANDBOX_IMAGE`: (Optional) Defaults to `ghcr.io/vndee/sandbox-python-311-bullseye`.

### Execution
1. **Start the MCP Server**:
   ```bash
   python Lustitia/MCP/server.py
   ```
2. **Run the Bias Audit**:
   ```bash
   python crew.py --csv path/to/dataset.csv
   ```

## Development Conventions

### Sandbox-First Execution
**Mandate**: No data processing, profiling, or analysis code should run on the host machine. All Python execution must be delegated to the `SandboxTool` which handles:
- Uploading the dataset to `/sandbox/dataset.csv`.
- Dynamic installation of required libraries.
- Extraction of `stdout`, `stderr`, and matplotlib plots (as base64).

### MCP Integration
Agents must query the MCP server for algorithm definitions using `get_bias_algorithm_from_mcp`. 
- `action='list'`: Discover available algorithm IDs.
- `action='info'`: Understand the purpose and suitability of an algorithm.
- `action='knowledge'`: Fetch the implementation pseudocode for the agent to translate into executable Python.

### Error Handling and Retries
The `Bias Analyst` agent is configured with `max_iter=20` and the `SandboxTool` supports tracking attempts. Agents are instructed to read `stderr` from failed sandbox runs, fix the code, and retry (up to 3 times per algorithm).

### Project Structure
- `crew.py`: Main entry point and CrewAI orchestration logic.
- `agents.py`: Configuration for Data Profiler, Bias Analyst, and Report Writer.
- `tasks.py`: Detailed task descriptions and expected outputs.
- `tools.py`: Custom tool implementations for Sandbox, MCP, and PDF generation.
- `Lustitia/MCP/`: Source code for the fairness knowledge server.
- `Lustitia/PAPER/`: Background research and reference implementations for bias algorithms.
- `reports/`: Default output directory for generated PDF audits.
