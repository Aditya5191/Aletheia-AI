# Setting up the Auditor MCP for watsonx Orchestrate

This plugin registers Aletheia's Auditor MCP server (`mcps/auditor/server.py` —
`list_algorithms`, `load_algorithm_knowledge`) into watsonx Orchestrate as a
**Remote MCP Toolkit**, so an Orchestrate agent can call it as a native tool.

## How it works

watsonx Orchestrate's Tool Catalog can import tools directly from a remote MCP
server via the ADK CLI's `orchestrate toolkits import --kind mcp` command. No new
code is required on Aletheia's side — this reuses the exact same Auditor MCP
server that already powers the Fairness Adjudicator and Mitigation agents.

**Important constraint:** watsonx Orchestrate's Catalog only supports **remote**
MCP servers — `localhost` will not work. You need `mcps/auditor/server.py`
reachable at a public URL, the same way it's already deployed for production
(see `AUDITOR_MCP_URL` in `backend/dataset_backend/backend/api.py`). For a demo,
tunneling it (e.g. `ngrok http 8001`) is enough.

## Prerequisites

1. **watsonx Orchestrate ADK CLI**:
   ```bash
   pip install ibm-watsonx-orchestrate
   orchestrate env activate <your-environment>
   ```
2. **The Auditor MCP server running somewhere publicly reachable**, serving its
   `/sse` endpoint (this is the same server started locally on port 8001 by
   `backend/dataset_backend/backend/api.py` in local dev mode).

## Setup Instructions

1. Deploy or tunnel `mcps/auditor/server.py` so it has a public URL, e.g.
   `https://your-host/sse`.
2. Run the import script from this folder:
   ```bash
   AUDITOR_MCP_URL="https://your-host/sse" ./import_toolkit.sh
   ```
   This runs:
   ```bash
   orchestrate toolkits import \
     --kind mcp \
     --name aletheia-auditor \
     --description "Aletheia bias-detection algorithm knowledge base (13 statistical and causal fairness algorithms)." \
     --url "https://your-host/sse" \
     --transport sse \
     --tools "*"
   ```
3. In the watsonx Orchestrate UI (Agent Builder / Tool Catalog), attach the
   imported `aletheia-auditor` toolkit to an agent. Orchestrate will surface
   `list_algorithms` and `load_algorithm_knowledge` as tools the agent's LLM can
   call directly — e.g. "which algorithm should I use to check disparate impact
   on a hiring dataset?"

## Notes

- Every tool on the Auditor MCP server already has a docstring/description
  (required by Orchestrate's import step — undocumented tools are skipped).
- This plugin only exposes the **Auditor** MCP (algorithm knowledge), not the
  Sandbox MCP (code execution) — Orchestrate agents aren't meant to run arbitrary
  Docker-sandboxed Python, so only the knowledge-lookup tools are surfaced here.
