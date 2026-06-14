# Setting up the Sandbox MCP for Codex

This skill requires the Sandbox MCP to securely execute Python data science code inside an isolated Docker container. 

The source code for the MCP is located in the `mcp_sandbox/` folder you just downloaded.

## Prerequisites
1. **Docker**: You must have Docker Desktop installed and running.
2. **Python**: You must have Python installed.

## Setup Instructions

1. **Build the Docker Image**
   Open your terminal, navigate to the `mcp_sandbox` folder, and build the sandbox image:
   ```bash
   cd path/to/skills/codex_aletheia-fairness-auditor/mcp_sandbox
   docker build -t sandbox-python:latest .
   ```

2. **Add to Codex Config**
   In Cursor or Codex, go to your MCP Settings panel.
   Add a new MCP server with the following details:
   - **Type**: `command`
   - **Command**: `python`
   - **Args**: `/absolute/path/to/codex_aletheia-fairness-auditor/mcp_sandbox/mcp_server.py`

3. **Restart the Agent**
   Once connected, your AI assistant will have access to the `sandbox bash tool (e.g. bash, sandbox_bash, or mcp__sandbox__bash)` tool and can run your audits securely!
