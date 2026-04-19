import asyncio

from mcp.server import NotificationOptions, Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

from Lustitia.Sandbox_MCP.sandbox import SandboxManager


manager = SandboxManager()

server = Server("sandbox")


@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="bash",
            description=(
                "Run a bash command in an existing sandbox container. "
                "Working directory is /workspace. Shell state does NOT persist between calls."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "container_id": {"type": "string"},
                    "command": {"type": "string"},
                },
                "required": ["container_id", "command"],
            },
        ),
        Tool(
            name="read_file",
            description=(
                "Read a file from /workspace in an existing sandbox container. "
                "Text files are returned as text. "
                "Binary files are returned as data:<mime>;base64,<data>."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "container_id": {"type": "string"},
                    "file_path": {
                        "type": "string",
                        "description": "Container path, e.g. /workspace/outputs/plot.png",
                    },
                },
                "required": ["container_id", "file_path"],
            },
        ),
        Tool(
            name="list_files",
            description="List all files under /workspace recursively for an existing sandbox container.",
            inputSchema={
                "type": "object",
                "properties": {
                    "container_id": {"type": "string"},
                },
                "required": ["container_id"],
            },
        ),
        Tool(
            name="quit_sandbox",
            description=(
                "Stop and remove an existing sandbox container by container_id. "
                "Retrieve outputs with read_file before calling this."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "container_id": {"type": "string"},
                },
                "required": ["container_id"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "bash":
        text = manager.bash(arguments["container_id"], arguments["command"])
        return [TextContent(type="text", text=text)]

    if name == "read_file":
        text = manager.read_file(arguments["container_id"], arguments["file_path"])
        return [TextContent(type="text", text=text)]

    if name == "list_files":
        text = manager.list_files(arguments["container_id"])
        return [TextContent(type="text", text=text)]

    if name == "quit_sandbox":
        text = manager.quit_sandbox(arguments["container_id"])
        return [TextContent(type="text", text=text)]

    return [TextContent(type="text", text=f"Unknown tool: {name}")]


if __name__ == "__main__":
    async def main() -> None:
        async with stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="sandbox",
                    server_version="1.0.0",
                    capabilities=server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={},
                    ),
                ),
            )

    asyncio.run(main())
