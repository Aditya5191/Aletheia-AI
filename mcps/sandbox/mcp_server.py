"""
Mini Claude Sandbox — MCP Server

Exposes 7 Docker sandbox tools via MCP over SSE:
  bash, write_file, read_file, edit_file, grep, list_files, quit_sandbox
"""

import asyncio
import logging
import sys
import os

from mcp.server import NotificationOptions, Server
from mcp.server.models import InitializationOptions
from mcp.server.sse import SseServerTransport
from mcp.types import TextContent, Tool
from starlette.applications import Starlette
from starlette.responses import JSONResponse, Response
from starlette.routing import Mount, Route
from starlette.middleware.cors import CORSMiddleware

from sandbox import SandboxManager

logging.basicConfig(level=logging.INFO)
# `sandbox` (imported above) already configured the root logger, so the basicConfig
# call above is a no-op. Force the root level to INFO explicitly and silence the
# chatty third-party loggers (SSE pings, HTTP transport, docker) so only meaningful
# sandbox tool events reach the terminal.
logging.getLogger().setLevel(logging.INFO)
for _noisy in ("mcp", "sse_starlette", "anyio", "asyncio", "httpcore",
               "httpx", "urllib3", "docker", "uvicorn.access"):
    logging.getLogger(_noisy).setLevel(logging.WARNING)
logger = logging.getLogger("mcp_server")

manager = SandboxManager()
server = Server("sandbox")


async def run_sync(func, *args, **kwargs):
    """Run a blocking function in a thread so the event loop stays free for SSE keepalives."""
    return await asyncio.to_thread(func, *args, **kwargs)


def _pipe_sandbox_logs():
    """Re-emit sandbox module logs to the MCP server's stdout in real time."""
    sandbox_log = logging.getLogger("sandbox")
    if not any(isinstance(h, logging.StreamHandler) for h in sandbox_log.handlers):
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s.%(msecs)03d [SANDBOX] %(levelname)s %(message)s",
            datefmt="%H:%M:%S"
        ))
        sandbox_log.addHandler(handler)
        sandbox_log.propagate = False

_pipe_sandbox_logs()


# ── Tool Definitions ──────────────────────────────────────────────────────

@server.list_tools()
async def list_tools():
    return [
        # ── 1. bash ───────────────────────────────────────────────────
        Tool(
            name="bash",
            description=(
                "Run a bash command in the sandbox container. "
                "Working directory is /workspace. Shell state does NOT persist between calls. "
                "Output is automatically truncated to 10,000 characters. "
                "For writing files, prefer write_file. For editing files, prefer edit_file."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": " Explanation of why you are calling this tool. MUST be provided.",
                    },
                    "container_id": {"type": "string"},
                    "command": {
                        "type": "string",
                        "description": "The bash command to execute.",
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "Timeout in seconds (default: 120).",
                    },
                },
                "required": ["reason", "container_id", "command"],
            },
        ),

        # ── 2. write_file ─────────────────────────────────────────────
        Tool(
            name="write_file",
            description=(
                "Create a new file or completely overwrite an existing file in the sandbox. "
                "Use this for writing NEW files (scripts, reports, configs). "
                "For small edits to existing files, use edit_file instead — "
                "it is much more token-efficient. "
                "The file content is written via Docker API (binary-safe). "
                "IMPORTANT: In Python code, use double backslashes for escape sequences "
                "(e.g. write \\n for newline, \\t for tab) since JSON decodes single backslashes."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "CRITICAL: MAXIMUM 5 WORDS. Describe what you are trying to achieve. E.g., 'Checking for missing values'.",
                    },
                    "container_id": {"type": "string"},
                    "file_path": {
                        "type": "string",
                        "description": "Absolute container path, e.g. /workspace/run_analysis.py",
                    },
                    "content": {
                        "type": "string",
                        "description": "The complete file content to write.",
                    },
                },
                "required": ["reason", "container_id", "file_path", "content"],
            },
        ),

        # ── 3. read_file ──────────────────────────────────────────────
        Tool(
            name="read_file",
            description=(
                "Read a file from the sandbox. Returns content with line numbers. "
                "For large files, use offset and limit to read specific sections — "
                "this avoids loading 30KB+ files into your context window. "
                "Example: offset=50, limit=20 reads lines 50-69 only. "
                "Binary files (images, etc.) are returned as base64."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "CRITICAL: MAXIMUM 5 WORDS. Describe what you are trying to achieve. E.g., 'Checking for missing values'.",
                    },
                    "container_id": {"type": "string"},
                    "file_path": {
                        "type": "string",
                        "description": "Absolute container path, e.g. /workspace/outputs/summary.txt",
                    },
                    "offset": {
                        "type": "integer",
                        "description": "Starting line number, 1-indexed (default: 1).",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of lines to read (default: all lines).",
                    },
                },
                "required": ["reason", "container_id", "file_path"],
            },
        ),

        # ── 4. edit_file ──────────────────────────────────────────────
        Tool(
            name="edit_file",
            description=(
                "Surgically edit a file by replacing a specific text chunk. "
                "Works like Claude Code's edit_file — only send the old text "
                "you want to find and the new text to replace it with. "
                "The old_text must be an EXACT match (including whitespace and indentation). "
                "NEVER rewrite entire files — use this for fixing bugs, updating imports, "
                "changing function logic, etc. Use read_file first to see the current content."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "CRITICAL: MAXIMUM 5 WORDS. Describe what you are trying to achieve. E.g., 'Checking for missing values'.",
                    },
                    "container_id": {"type": "string"},
                    "file_path": {
                        "type": "string",
                        "description": "Absolute container path, e.g. /workspace/run_analysis.py",
                    },
                    "old_text": {
                        "type": "string",
                        "description": "The exact text to find in the file. Must match exactly once.",
                    },
                    "new_text": {
                        "type": "string",
                        "description": "The replacement text.",
                    },
                },
                "required": ["reason", "container_id", "file_path", "old_text", "new_text"],
            },
        ),

        # ── 5. grep ───────────────────────────────────────────────────
        Tool(
            name="grep",
            description=(
                "Search for a text pattern in files inside the sandbox. "
                "Returns matching lines with file paths and line numbers. "
                "Use this to find specific code, errors, or variables without "
                "reading entire files into context."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "CRITICAL: MAXIMUM 5 WORDS. Describe what you are trying to achieve. E.g., 'Checking for missing values'.",
                    },
                    "container_id": {"type": "string"},
                    "pattern": {
                        "type": "string",
                        "description": "The text pattern to search for (supports regex).",
                    },
                    "path": {
                        "type": "string",
                        "description": "Path to search in (default: /workspace).",
                    },
                    "include": {
                        "type": "string",
                        "description": "File glob pattern, e.g. '*.py' to only search Python files.",
                    },
                },
                "required": ["reason", "container_id", "pattern"],
            },
        ),

        # ── 6. list_files ─────────────────────────────────────────────
        Tool(
            name="list_files",
            description="List all files under /workspace (or a specified path) recursively.",
            inputSchema={
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "CRITICAL: MAXIMUM 5 WORDS. Describe what you are trying to achieve. E.g., 'Checking for missing values'.",
                    },
                    "container_id": {"type": "string"},
                    "path": {
                        "type": "string",
                        "description": "Path to list (default: /workspace).",
                    },
                },
                "required": ["reason", "container_id"],
            },
        ),

        # ── 7. lint_code ──────────────────────────────────────────────
        Tool(
            name="lint_code",
            description=(
                "Check a Python script for syntax errors using py_compile. "
                "Always run this BEFORE executing any newly written or edited Python script. "
                "If errors are found, it will return the exact line number and error message. "
                "Use edit_file to fix any errors before executing."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "CRITICAL: MAXIMUM 5 WORDS. Describe what you are trying to achieve. E.g., 'Checking for missing values'.",
                    },
                    "container_id": {"type": "string"},
                    "file_path": {
                        "type": "string",
                        "description": "Absolute container path to the python file, e.g. /workspace/run_analysis.py",
                    },
                },
                "required": ["reason", "container_id", "file_path"],
            },
        ),

        # ── 8. execute_cell ───────────────────────────────────────────
        Tool(
            name="execute_cell",
            description=(
                "Execute Python code in a persistent interactive REPL session (like a Jupyter Notebook cell). "
                "Variables, functions, and imports persist between calls. "
                "Use this instead of write_file for data exploration, testing shapes, and building complex algorithms block-by-block. "
                "Returns the stdout (print statements) and stderr (Tracebacks). "
                "Output is automatically truncated if too long."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "CRITICAL: MAXIMUM 5 WORDS. Describe what you are trying to achieve. E.g., 'Checking for missing values'.",
                    },
                    "container_id": {"type": "string"},
                    "code": {
                        "type": "string",
                        "description": "The Python code to execute in the stateful kernel.",
                    },
                },
                "required": ["reason", "container_id", "code"],
            },
        ),

        # ── 9. quit_sandbox ───────────────────────────────────────────
        Tool(
            name="quit_sandbox",
            description=(
                "Stop and remove a sandbox container. "
                "Retrieve outputs with read_file before calling this."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "Brief 3-5 word explanation of why you are calling this tool. MUST be short.",
                    },
                    "container_id": {"type": "string"},
                },
                "required": ["reason", "container_id"],
            },
        ),
    ]


# ── Tool Router ───────────────────────────────────────────────────────────

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    cid = arguments.get("container_id", "")
    logger.info(f"[TOOL] {name} | container={cid[:12]}")

    if name == "bash":
        text = await run_sync(
            manager.bash, cid, arguments["command"],
            timeout=arguments.get("timeout", 120),
        )
        return [TextContent(type="text", text=text)]

    if name == "write_file":
        text = await run_sync(manager.write_file, cid, arguments["file_path"], arguments["content"])
        return [TextContent(type="text", text=text)]

    if name == "read_file":
        raw_offset = arguments.get("offset", 1)
        raw_limit = arguments.get("limit")
        text = await run_sync(
            manager.read_file, cid, arguments["file_path"],
            offset=int(raw_offset) if raw_offset is not None else 1,
            limit=int(raw_limit) if raw_limit is not None else None,
        )
        return [TextContent(type="text", text=text)]

    if name == "edit_file":
        text = await run_sync(
            manager.edit_file, cid, arguments["file_path"],
            arguments["old_text"], arguments["new_text"],
        )
        return [TextContent(type="text", text=text)]

    if name == "grep":
        text = await run_sync(
            manager.grep, cid, arguments["pattern"],
            path=arguments.get("path", "/workspace"),
            include=arguments.get("include"),
        )
        return [TextContent(type="text", text=text)]

    if name == "list_files":
        text = await run_sync(manager.list_files, cid, path=arguments.get("path", "/workspace"))
        return [TextContent(type="text", text=text)]

    if name == "lint_code":
        text = await run_sync(manager.lint_code, cid, arguments["file_path"])
        return [TextContent(type="text", text=text)]

    if name == "execute_cell":
        text = await run_sync(manager.execute_cell, cid, arguments["code"])
        return [TextContent(type="text", text=text)]

    if name == "quit_sandbox":
        text = await run_sync(manager.quit_sandbox, cid)
        return [TextContent(type="text", text=text)]

    return [TextContent(type="text", text=f"Unknown tool: {name}")]


# ── SSE Transport ─────────────────────────────────────────────────────────

sse = SseServerTransport("/messages/")


async def handle_sse(request):
    logger.info(f"New connection: {request.method} {request.url}")
    if request.method == "POST":
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
                server_version="2.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )
    return Response()


async def heartbeat(request):
    return JSONResponse({"status": "ok", "server": "mcp-sandbox", "version": "2.0.0"})


starlette_app = Starlette(
    debug=False,
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
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting MCP Sandbox Server v2.0.0 on 0.0.0.0:{port}")
    uvicorn.run(starlette_app, host="0.0.0.0", port=port)
