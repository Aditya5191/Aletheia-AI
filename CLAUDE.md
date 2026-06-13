# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Aletheia AI is a multi-agent system for automated algorithmic fairness auditing. Users upload a CSV; a four-agent LangGraph pipeline (Data Surveyor → Fairness Adjudicator → Mitigation Agent → Report Compiler) runs inside a Docker sandbox, selects from 13 bias-detection algorithms, and produces a PDF audit report with before/after comparisons.

## Commands

### Backend
```bash
pip install -r requirements.txt

# Run full CLI audit (starts Docker sandbox + MCP servers + agent graph)
python main.py

# Start backend API server only
uvicorn backend.dataset_backend.backend.api:app --host 0.0.0.0 --port 8005
```

### Frontend
```bash
cd frontend/agenticflow
npm install
npm run dev        # http://localhost:3000
npm run build
npm run lint
```

### Docker Sandbox Image
```bash
docker build -t sandbox-python:latest ./mcps/sandbox
```

## Architecture

### Agent Pipeline
Defined in [backend/dataset_backend/agents/graph.py](backend/dataset_backend/agents/graph.py). The four agents communicate via a LangGraph typed state machine:

1. **Data Surveyor** — EDA, proxy detection, writes `outputs/agent1.md` + `attributes.json`
2. **Fairness Adjudicator** — Selects 1 of 13 algorithms, implements it, writes `outputs/agent2.md`
3. **Mitigation Agent** — Applies calibration/residualization, writes mitigated CSV + `outputs/agent3.md`
4. **Report Compiler** — Reads agent1–3 disk outputs, generates charts, produces `outputs/audit_report.pdf`

**Context handoff pattern:** At each agent boundary, `RemoveMessage` clears message history and the next agent reads the previous agent's markdown report from disk — this prevents context window exhaustion.

Each agent's system prompt is an externalized Markdown file in [backend/dataset_backend/agents/prompts/](backend/dataset_backend/agents/prompts/). Container IDs are injected at runtime via `.replace("{container_id}", container_id)`.

### MCP Servers
Three FastMCP servers communicate with agents via SSE:

| Server | Port | Purpose |
|--------|------|---------|
| `mcps/auditor/server.py` | 8000 | Delivers algorithm knowledge (`list_algorithms`, `load_algorithm_knowledge`) |
| `mcps/sandbox/mcp_server.py` | 8002 | Dockerized Python REPL (`bash`, `execute_cell`, `read_file`, `write_file`, etc.) |
| `mcps/miscellaneous/server.py` | — | Chart schema delivery (`get_chart_schemas`) |

The sandbox's `execute_cell` maintains a persistent kernel state across calls (Jupyter-style REPL), so variables persist between tool calls within one agent's run.

### Algorithm Library
`mcps/auditor/` contains 13 bias algorithms in two types:
- **PURE** — `knowledge.md` with complete pseudo-code + math (agent implements from scratch)
- **FRAMEWORK** — `framework.yaml` DAG + `framework_scaffold.py` executor for complex multi-step algorithms

Research papers for each algorithm are in `PAPER/Algo1/` through `PAPER/Algo13/`.

### Frontend
Next.js 16 / React 19 / TypeScript app in [frontend/agenticflow/](frontend/agenticflow/). Key components:

- **FlowCanvas.tsx** — Interactive node graph (xyflow) + WebSocket listener that parses `message`, `tool_calls`, `tool_result` event types from the backend `/stream` endpoint
- **NodeDetailModal.tsx** — Tabbed deep-dive modal (Analytics, Review, Code) with schema-driven chart rendering
- **AgentNode.tsx** — Live agent status with smart completion notifications
- **TourWindow.tsx** — Guided walkthrough with mock data (no real upload needed; use "Show Tour" in TopAppBar to test UI without running the pipeline)

The frontend connects to the backend's WebSocket `/stream` endpoint. Agents generate chart JSON matching the schemas from `get_chart_schemas`; the frontend renders them dynamically without hardcoded chart types.

### API & Streaming
[backend/dataset_backend/backend/api.py](backend/dataset_backend/backend/api.py) — FastAPI WebSocket handler. Manages sandbox container lifecycle and streams agent events to the frontend as they occur.

## Key Gotchas

- **Vertex AI credentials** — `GOOGLE_APPLICATION_CREDENTIALS` must point to `.secrets/vertex-credentials.json` (Google Cloud service account). Set before running.
- **Docker socket** — The backend requires access to `/var/run/docker.sock` to spawn sandbox containers. In production this runs on a dedicated VM.
- **Empty message filtering** — `clean_messages()` in graph.py strips empty tool messages before Vertex AI calls; omitting this causes 400 errors.
- **matplotlib backend** — Sandbox uses `Agg` (headless); always set `matplotlib.use('Agg')` before importing pyplot in sandbox code.
- **MCP readiness** — `main.py` polls the `/sse` endpoint (not `/`) to confirm MCP servers are alive before starting the graph.

## Deployment

- **Frontend:** Google Cloud Run (auto-scaling), Docker image from `frontend/agenticflow/Dockerfile`
- **Backend:** Dedicated Cloud VM, image from `Dockerfile.backend`
- **Auditor MCP:** Local — runs `python mcps/auditor/server.py`
- **Sandbox:** Spawned ephemerally per audit inside the Cloud VM via Docker socket
