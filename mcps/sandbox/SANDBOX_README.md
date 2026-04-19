# Agent Sandbox MCP Server

This project provides an MCP server that exposes Docker-backed sandbox tools to any MCP-compatible agent.

## Files

- mcp_server.py: MCP tool registration and routing.
- sandbox.py: Docker container attachment and execution manager.
- Dockerfile: Sandbox runtime image.

## Prerequisites

- Docker Engine installed and running.
- Python 3.10+.
- Python dependencies:

```bash
pip install mcp docker
```

## Build Sandbox Image

```bash
docker build -t fairsight-sandbox:latest .
```

## Run MCP Server (stdio)

```bash
python mcp_server.py
```

## Exposed MCP Tools

1. bash(container_id, command)
2. read_file(container_id, file_path)
3. list_files(container_id)
4. quit_sandbox(container_id)

## Agent Usage Pattern

1. Your backend spawns a sandbox container and uploads the file into it.
2. Your backend returns the container ID to the frontend/agent.
3. Agent calls MCP tools using that container_id.
4. Run code with bash and save generated artifacts under /workspace/outputs.
5. Call list_files after code execution.
6. Call read_file to retrieve text or binary outputs.
7. Call quit_sandbox when fully done.

## Important Execution Rules for Agents

1. Do not use interactive tools: nano, vim, less, top, python REPL.
2. Write scripts via heredoc and run them non-interactively.
3. Shell state does not persist between bash calls.
4. For plots/images, use plt.savefig() into /workspace/outputs and then read_file.

## Notes

- Binary files are returned as data URLs: data:<mime>;base64,<content>.
- The MCP server does not create containers or upload files.
- The backend owns container creation and input file placement.
- quit_sandbox stops and removes the referenced container.
