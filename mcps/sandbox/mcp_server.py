import asyncio
import logging

from mcp.server import NotificationOptions, Server
from mcp.server.models import InitializationOptions
from mcp.server.sse import SseServerTransport
from mcp.types import TextContent, Tool
from starlette.applications import Starlette
from starlette.responses import JSONResponse, Response
from starlette.routing import Mount, Route
from starlette.middleware.cors import CORSMiddleware

from sandbox import SandboxManager

# Configure logging to be more verbose
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("mcp_server")

manager = SandboxManager()
server = Server("sandbox")

@server.list_tools()
async def list_tools():
    logger.debug("Listing tools...")
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
    logger.info(f"Calling tool: {name} with arguments: {arguments}")
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

sse = SseServerTransport("/messages/")

async def handle_sse(request):
    logger.info(f"New connection request: {request.method} {request.url}")
    if request.method == "POST":
        # Some clients probe with POST /sse, return 200 OK
        return JSONResponse({"status": "ready"}, status_code=200)
    
    async with sse.connect_sse(
        request.scope, request.receive, request._send
    ) as streams:
        logger.info("SSE connection established")
        await server.run(
            streams[0],
            streams[1],
            InitializationOptions(
                server_name="sandbox",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )
    return Response()

async def heartbeat(request):
    return JSONResponse({"status": "ok", "server": "mcp-sandbox"})

starlette_app = Starlette(
    debug=True,
    routes=[
        Route("/", endpoint=heartbeat),
        Route("/sse", endpoint=handle_sse, methods=["GET", "POST"]),
        Mount("/messages/", app=sse.handle_post_message),
    ],
)

starlette_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting MCP server on 0.0.0.0:8000")
    uvicorn.run(starlette_app, host="0.0.0.0", port=8000)
