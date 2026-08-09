#!/usr/bin/env bash
# Imports Aletheia's Auditor MCP server into watsonx Orchestrate as a Remote MCP
# Toolkit, using the watsonx Orchestrate ADK CLI (`orchestrate`).
#
# Prerequisites:
#   - `orchestrate` ADK CLI installed and authenticated
#     (pip install ibm-watsonx-orchestrate; orchestrate env activate <env>)
#   - Aletheia's Auditor MCP server running at a PUBLICLY REACHABLE URL.
#     watsonx Orchestrate's Tool Catalog only supports Remote MCP servers,
#     not localhost — deploy mcps/auditor/server.py the same way you already
#     do for prod (see AUDITOR_MCP_URL in backend/dataset_backend/backend/api.py),
#     or tunnel it (e.g. ngrok) for a demo.
#
# Usage:
#   AUDITOR_MCP_URL="https://your-deployed-host/sse" ./import_toolkit.sh

set -euo pipefail

TOOLKIT_NAME="${TOOLKIT_NAME:-aletheia-auditor}"
TOOLKIT_DESCRIPTION="${TOOLKIT_DESCRIPTION:-Aletheia bias-detection algorithm knowledge base (13 statistical and causal fairness algorithms).}"
AUDITOR_MCP_URL="${AUDITOR_MCP_URL:?Set AUDITOR_MCP_URL to your Auditor MCP server's public /sse endpoint}"
TRANSPORT="${TRANSPORT:-sse}"
TOOLS="${TOOLS:-*}"

echo "[watsonx] Importing MCP toolkit '${TOOLKIT_NAME}' from ${AUDITOR_MCP_URL} (${TRANSPORT})..."

orchestrate toolkits import \
  --kind mcp \
  --name "${TOOLKIT_NAME}" \
  --description "${TOOLKIT_DESCRIPTION}" \
  --url "${AUDITOR_MCP_URL}" \
  --transport "${TRANSPORT}" \
  --tools "${TOOLS}"

echo "[watsonx] Done. Attach the '${TOOLKIT_NAME}' toolkit to an Orchestrate agent"
echo "          from the Tool Catalog / Agent Builder UI, or via 'orchestrate agents'."
