# Setting up the Sandbox MCP for Antigravity

This skill requires the Sandbox MCP to securely execute Python data science code inside an isolated Docker container. 

The source code for the MCP is located in the `mcp_sandbox/` folder you just downloaded.

## Prerequisites
1. **Docker**: You must have Docker Desktop installed and running.
2. **Python**: You must have Python installed.

## Setup Instructions

1. **Build the Docker Image**
   Open your terminal, navigate to the `mcps/sandbox` folder, and build the sandbox image:
   ```bash
   cd path/to/plugins/antigravity_aletheia-fairness-plugin/mcps/sandbox
   docker build -t sandbox-python:latest .
   ```

2. **Add to Antigravity Config**
   Antigravity loads MCP servers via the `.gemini/config/mcp.json` file (or its equivalent config panel). 
   Add a new server configuration pointing to the `mcp_server.py` file:
   ```json
   {
     "mcpServers": {
       "sandbox": {
         "command": "python",
         "args": ["/absolute/path/to/antigravity_aletheia-fairness-plugin/mcps/sandbox/mcp_server.py"]
       }
     }
   }
   ```

3. **Restart the Agent**
   Once connected, your Antigravity assistant will have access to the `sandbox bash tool (e.g. bash, sandbox_bash, or mcp__sandbox__bash)` tool and can run your audits securely!
