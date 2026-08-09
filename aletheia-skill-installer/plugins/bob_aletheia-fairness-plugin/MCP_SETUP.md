# Setting up the Sandbox MCP for IBM Bob

This plugin gives IBM Bob access to Aletheia's Sandbox MCP — a Dockerized Python REPL
that securely executes data-science code (pandas/sklearn/etc.) inside an isolated
container. It's the same MCP server used by the Claude Code, Codex, and Antigravity
variants of this plugin.

## Prerequisites
1. **Docker** — must be installed and running (Docker Desktop or daemon).
2. **Python** — must be available on `PATH`.

## Setup Instructions

1. **Build the Docker image**
   ```bash
   cd path/to/bob_aletheia-fairness-plugin/mcps/sandbox
   docker build -t sandbox-python:latest .
   ```

2. **Register the MCP server with Bob**

   Bob reads MCP server config from a project-level `.bob/mcp.json` (already included
   in this plugin) or a global config, and can also be managed from the UI: click the
   **3-dot menu next to the gear icon** in the chat window → **MCP Servers**.

   This plugin ships `.bob/mcp.json` at its root:
   ```json
   {
     "mcpServers": {
       "aletheia-sandbox": {
         "command": "python",
         "args": ["./mcps/sandbox/mcp_server.py"]
       }
     }
   }
   ```
   Drop this plugin folder into your project (or point Bob's global config at it) and
   Bob will auto-load the server. If you'd rather run the server elsewhere and connect
   remotely, Bob also supports a `url` (SSE) or `httpURL` (streamable HTTP) key instead
   of `command`/`args` — point it at wherever `mcps/sandbox/mcp_server.py` (or the main
   repo's `mcps/auditor/server.py`, for algorithm-knowledge lookups) is actually running,
   e.g.:
   ```json
   {
     "mcpServers": {
       "aletheia-auditor": { "url": "http://localhost:8001/sse" }
     }
   }
   ```

3. **Restart Bob / reload the MCP panel**

   Once connected, Bob will have access to the sandbox's tools (`bash`, `execute_cell`,
   `read_file`, `write_file`, etc.) and can run fairness audits directly from your editor
   or Bob Shell.

## Note on `skills/`

This folder also ships `skills/bob_aletheia-fairness-auditor/` with the same reference
material (algorithm knowledge, workflow docs) used by the Claude Code plugin's
slash-command skills. Bob's documented extensibility mechanism is MCP, not a
Claude-style skills/slash-command system — so this folder isn't auto-loaded by Bob.
Treat it as reference material you can paste into a Bob conversation for extra context,
not as something Bob wires up automatically.
