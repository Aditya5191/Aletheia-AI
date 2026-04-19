# Agent Sandbox — MCP Docker Execution Server

A persistent, isolated Docker-based code execution sandbox exposed as an **MCP (Model Context Protocol) server**. Any MCP-compatible agent connects to this server and gets tools to spawn containers, run bash commands, retrieve files, and read back plots or images — all without knowing anything about Docker internals.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [What Changed from Direct Python Integration](#what-changed-from-direct-python-integration)
3. [Prerequisites](#prerequisites)
4. [File Structure](#file-structure)
5. [Setup](#setup)
6. [MCP Tools Reference](#mcp-tools-reference)
7. [Handling Non-Text Output (Plots & Images)](#handling-non-text-output-plots--images)
8. [System Prompt Instructions](#system-prompt-instructions)
9. [Security Model](#security-model)
10. [Sandbox Lifecycle](#sandbox-lifecycle)
11. [Writing Files Inside the Sandbox](#writing-files-inside-the-sandbox)
12. [Handling Long-Running Commands](#handling-long-running-commands)
13. [Scaling to Multiple Workers](#scaling-to-multiple-workers)
14. [Common Pitfalls](#common-pitfalls)
15. [Full MCP Server Code](#full-mcp-server-code)

---

## Architecture Overview

```
Agent (Claude or any MCP client)
        │
        │  MCP protocol (stdio or SSE)
        ▼
┌─────────────────────────────┐
│       MCP Server            │  ← mcp_server.py
│                             │
│  tools:                     │
│   - create_sandbox          │
│   - bash                    │
│   - read_file               │
│   - list_files              │
│   - quit_sandbox            │
└────────────┬────────────────┘
             │  docker SDK via /var/run/docker.sock
             ▼
┌─────────────────────────────┐
│    Docker Container         │  ← fairsight-sandbox:latest
│                             │
│   /workspace/               │  ← host-mounted, has uploaded file
│     data.csv                │
│     script.py               │
│     outputs/                │
│       plot.png              │
│       report.csv            │
└─────────────────────────────┘
```

Key design decisions:
- **MCP server is the only interface.** The agent never touches Docker directly. It only knows about MCP tools.
- **No HTTP server inside the container.** Commands still go via Docker's `exec_run` API over the Unix socket. The MCP layer sits outside the container on the host.
- **One container per session.** Each `create_sandbox` call spawns a fresh container. Sessions identified by a `session_id` (UUID recommended).
- **Binary output supported.** The `read_file` tool reads any file from `/workspace` on the host-mounted volume and returns it as base64 — so plots, PDFs, and pickled results come back to the agent cleanly.
- **Idle watchdog.** Background thread kills containers after `IDLE_TIMEOUT` seconds of no tool calls.
- **No network inside the container.** `network_mode="none"` is set at spawn time.

---

## What Changed from Direct Python Integration

If you were previously using `sandbox.py` + `tools.py` + `agent.py` directly, here is what changed conceptually:

| Before (direct Python) | Now (MCP server) |
|---|---|
| Import `sandbox.py` into your agent code | Run `mcp_server.py` as a separate process |
| Pass `TOOLS` list to `client.messages.create()` | Agent discovers tools automatically via MCP |
| Call `handle_tool()` manually in your loop | MCP server handles routing internally |
| One codebase for agent + sandbox | Decoupled — any MCP-compatible agent works |
| No image return support | `read_file` returns base64 for any file type |
| Hard to reuse across projects | Connect any agent to the same server |

The Docker container internals (`exec_run`, watchdog, lifecycle) are identical. Only the interface layer changed.

---

## Prerequisites

**Host machine:**
- Docker Engine installed and running
- Python 3.10+
- `pip install mcp docker`
- Your agent must support MCP (Claude Desktop, Claude API with MCP, LangGraph with MCP adapter, etc.)

**Docker image:**
- Must be pre-built before running (see [Setup](#setup))
- Image name expected: `fairsight-sandbox:latest` (configurable in `mcp_server.py`)

---

## File Structure

```
project/
├── mcp_server.py       # MCP server — exposes sandbox tools over stdio/SSE
├── sandbox.py          # Sandbox manager (unchanged Docker logic)
├── Dockerfile          # The sandbox container image
└── SANDBOX_README.md   # This file
```

`agent.py` and `tools.py` are gone. The MCP server replaces both.

---

## Setup

### 1. Build the Docker image

```dockerfile
FROM python:3.11-slim

RUN pip install \
    pandas \
    numpy \
    scikit-learn \
    aif360 \
    fairlearn \
    shap \
    matplotlib \
    seaborn \
    joblib \
    --quiet

# Create outputs dir so plots have a home
RUN mkdir -p /workspace/outputs

WORKDIR /workspace
```

```bash
docker build -t fairsight-sandbox:latest .
```

### 2. Install Python dependencies

```bash
pip install mcp docker
```

### 3. Run the MCP server

**stdio mode** (for Claude Desktop or local agents):
```bash
python mcp_server.py
```

**SSE mode** (for remote agents or HTTP-based MCP clients):
```bash
python mcp_server.py --transport sse --port 8080
```

### 4. Connect your agent

For **Claude Desktop**, add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "sandbox": {
      "command": "python",
      "args": ["/absolute/path/to/mcp_server.py"]
    }
  }
}
```

For **Claude API** with MCP:
```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4096,
    mcp_servers=[{
        "type": "url",
        "url": "http://localhost:8080/sse",
        "name": "sandbox"
    }],
    messages=[{"role": "user", "content": "Audit the uploaded dataset."}]
)
```

---

## MCP Tools Reference

The MCP server exposes five tools. The agent calls these by name.

---

### `create_sandbox`

Spawns a Docker container for a session and loads the uploaded file into it.

**Input:**
| Field | Type | Description |
|---|---|---|
| `session_id` | `string` | Unique session identifier (UUID recommended). |
| `uploaded_file_path` | `string` | Absolute path to the uploaded file **on the host**. Gets copied into the container at `/workspace/<filename>`. |

**Returns:** Confirmation string with container name and file path inside the container.

**Notes:**
- Call this once per user upload before any `bash` calls.
- If called again with the same `session_id`, it returns the existing sandbox (idempotent).
- The container starts with `/workspace` as working directory.

---

### `bash`

Runs a bash command inside the container for a session.

**Input:**
| Field | Type | Description |
|---|---|---|
| `session_id` | `string` | Which session to run in. |
| `command` | `string` | Any bash command. Runs as `bash -c <command>`. |

**Returns:** Combined stdout + stderr as a string. Appends `[exit code N]` if non-zero.

**Notes:**
- Resets the idle timer.
- Each call is a **fresh shell** — `cd`, `export`, env vars do NOT persist between calls.
- To persist state, write to files and read them back.
- Never use interactive tools (nano, vim, less, top). See [System Prompt Instructions](#system-prompt-instructions).
- If the command produces a plot or image, it will not appear here — use `read_file` after saving it to `/workspace/outputs/`.

---

### `read_file`

Reads any file from `/workspace` in the container (via the host-mounted volume) and returns its contents.

**Input:**
| Field | Type | Description |
|---|---|---|
| `session_id` | `string` | Which session to read from. |
| `file_path` | `string` | Path **inside the container**, e.g. `/workspace/outputs/plot.png` or `/workspace/report.csv`. |

**Returns:**
- For **text files** (`.py`, `.csv`, `.txt`, `.json`, `.log`): returns the raw text content.
- For **binary files** (`.png`, `.jpg`, `.pdf`, `.pkl`): returns a base64-encoded string prefixed with the MIME type, e.g.:  
  `data:image/png;base64,iVBORw0KGgo...`

The agent (or the calling application) can decode this and display/save the image.

**Notes:**
- The MCP server reads from the host-mounted workdir at `/tmp/fairsight/<session_id>/`, not by running `cat` inside the container. This is faster and works for binary files.
- File must exist — the agent should save outputs explicitly before calling `read_file`.

---

### `list_files`

Lists all files in `/workspace` (recursively) for a session.

**Input:**
| Field | Type | Description |
|---|---|---|
| `session_id` | `string` | Which session to inspect. |

**Returns:** Newline-separated list of relative file paths, e.g.:
```
data.csv
script.py
outputs/plot.png
outputs/bias_report.json
```

**Notes:**
- Useful for the agent to discover what files exist before calling `read_file`.
- Call this after running code that generates outputs, so the agent knows what was produced.

---

### `quit_sandbox`

Stops and removes the container, and cleans up the host workdir.

**Input:**
| Field | Type | Description |
|---|---|---|
| `session_id` | `string` | Which session to destroy. |

**Returns:** Confirmation string.

**Notes:**
- Call this when the task is complete.
- After this, `bash` and `read_file` calls for this session will return an error.
- The host workdir (`/tmp/fairsight/<session_id>/`) is deleted, including all outputs.
- If you need to preserve outputs, call `read_file` and save them **before** calling `quit_sandbox`.

---

## Handling Non-Text Output (Plots & Images)

This is the most important section if your agent generates visualizations.

### The problem

`bash` only returns stdout/stderr — plain text. If the agent runs:
```python
import matplotlib.pyplot as plt
plt.plot([1, 2, 3])
plt.savefig("plot.png")
```
...the `bash` tool returns nothing useful about the plot. The image is sitting in `/workspace/plot.png` inside the container, invisible to the agent.

### The solution: save to `/workspace/outputs/`, then call `read_file`

The correct workflow is:

**Step 1 — Agent runs bash, saves plot to outputs/**
```bash
cat > plot_bias.py << 'EOF'
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("data.csv")
fig, ax = plt.subplots()
df["age"].hist(by=df["label"], ax=ax)
plt.tight_layout()
plt.savefig("/workspace/outputs/age_distribution.png", dpi=150)
print("saved: outputs/age_distribution.png")
EOF
python3 plot_bias.py
```

**Step 2 — Agent calls `list_files` to confirm it was created**
```
session_id: "abc123"
```
Returns:
```
data.csv
plot_bias.py
outputs/age_distribution.png
```

**Step 3 — Agent calls `read_file` to retrieve it**
```
session_id: "abc123"
file_path: "/workspace/outputs/age_distribution.png"
```
Returns:
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

**Step 4 — Your application decodes and displays it**
```python
import base64

raw = tool_result.replace("data:image/png;base64,", "")
image_bytes = base64.b64decode(raw)
with open("age_distribution.png", "wb") as f:
    f.write(image_bytes)
```

### Supported output types via `read_file`

| File type | MIME prefix returned | Use case |
|---|---|---|
| `.png` | `data:image/png;base64,` | Matplotlib, seaborn, any plot |
| `.jpg` / `.jpeg` | `data:image/jpeg;base64,` | Photos, compressed images |
| `.pdf` | `data:application/pdf;base64,` | Multi-page reports |
| `.csv` | *(raw text)* | Tabular results, bias metrics |
| `.json` | *(raw text)* | Structured audit results |
| `.txt` / `.log` | *(raw text)* | Logs, summaries |
| `.pkl` | `data:application/octet-stream;base64,` | Serialized models |

### Telling the agent about this pattern

Add this to your system prompt (see [System Prompt Instructions](#system-prompt-instructions)):

```
When your code generates a plot or any non-text output:
1. Always save it to /workspace/outputs/<filename> inside the code.
2. After running the code, call list_files to confirm it was created.
3. Call read_file with the full path to retrieve it.
4. Do NOT try to display plots inline (plt.show()) — this hangs. Always use plt.savefig().
```

### Multiple plots in one run

```python
# Save each plot with a distinct name
plt.savefig("/workspace/outputs/plot_01_distribution.png", dpi=150)
plt.clf()
# ... more code ...
plt.savefig("/workspace/outputs/plot_02_shap.png", dpi=150)
```

Then retrieve all of them:
```
list_files → see outputs/plot_01_distribution.png, outputs/plot_02_shap.png
read_file → /workspace/outputs/plot_01_distribution.png
read_file → /workspace/outputs/plot_02_shap.png
```

---

## System Prompt Instructions

Include this block in your system prompt verbatim. It covers both file-writing behaviour and plot handling.

```
You are operating inside a Docker sandbox via MCP tools. The uploaded file is at /workspace.

Available tools: create_sandbox, bash, read_file, list_files, quit_sandbox.

RULES:

1. Never use interactive editors or viewers: nano, vim, vi, emacs, less, more,
   top, htop, python3 (REPL). These require a TTY and will hang forever.

2. Write files using heredoc syntax:
       cat > script.py << 'EOF'
       # your code here
       EOF
   Then run: python3 script.py

3. Read a file before editing it: cat filename.py
   Then rewrite the whole file cleanly with cat > ... << 'EOF'.

4. Shell state does NOT persist between bash calls.
   cd, export, and variable assignments are lost after each call.
   Chain dependent commands with && in a single call.

5. For plots and images:
   - Never call plt.show() — it hangs. Always use plt.savefig().
   - Save all outputs to /workspace/outputs/<name>.
   - After running, call list_files to confirm the file exists.
   - Call read_file to retrieve the image or file.

6. For large outputs, redirect to a file and read summaries:
       python3 script.py > output.txt 2>&1
       head -50 output.txt

7. Call list_files after any code run that produces files,
   so you know what was created.

8. When fully done, call quit_sandbox.
   Before quitting, call read_file for any outputs you want to preserve —
   the container and all files are deleted permanently on quit.
```

---

## Security Model

### What is isolated
- **Filesystem:** Container sees only its own root fs + `/workspace`. Cannot access anything else on the host.
- **Network:** `network_mode="none"` — zero inbound or outbound connections. Malicious code cannot exfiltrate data or download payloads.
- **Process space:** Separate PID namespace.
- **Resources:** Memory capped at 2GB, CPU at 1 core via `mem_limit` and `cpu_quota`.

### What is NOT isolated
- **Kernel:** Containers share the host kernel. A kernel exploit can escape. For higher assurance, use gVisor (`--runtime=runsc`) or Firecracker-based runtimes instead of plain runc.
- **Docker socket:** The MCP server process has access to `/var/run/docker.sock` and therefore full Docker control. Do not expose this socket to the agent or to untrusted processes.
- **MCP server itself:** The MCP server runs on the host. If an attacker can send arbitrary tool calls to the MCP server, they can spawn containers and run code. Authenticate your MCP endpoint if exposing over SSE.

### Threat: Malicious uploaded files
Pickle (`.pkl`), joblib, and some model formats execute code on load. With `network_mode="none"`, exfiltration is blocked, but the container itself can still be damaged. For defense in depth:
- Scan uploads before passing to `create_sandbox`
- Run the container as a non-root user (add `user="1000:1000"` to `containers.run`)
- Add `read_only=True` for the root fs and only allow writes to `/workspace` via the mount

### Running as non-root (recommended)

In `Dockerfile`:
```dockerfile
RUN useradd -m -u 1000 agent
USER agent
```

In `sandbox.py` `containers.run()` call:
```python
user="1000:1000",
```

---

## Sandbox Lifecycle

```
create_sandbox called
      │
      ▼
Container starts ("sleep infinity") ──────────────────────────┐
      │                                                         │
      ├── bash() called  ──► resets idle timer                 │
      ├── read_file() called ──► resets idle timer             │
      ├── list_files() called ──► resets idle timer            │
      ├── ...                                                   │
      │                                                         │
      ├── [idle for IDLE_TIMEOUT seconds, default 300]         │
      │         │                                               │
      │         ▼                                               │
      │   watchdog fires → container stopped + workdir deleted  │
      │                                                         │
      └── quit_sandbox() called → same cleanup immediately ◄───┘
```

Adjust `IDLE_TIMEOUT` in `mcp_server.py`:
```python
IDLE_TIMEOUT = 600  # 10 minutes
```

---

## Writing Files Inside the Sandbox

All file writes go through bash. Use these patterns:

### Write a new file (heredoc — always use this)
```bash
cat > analysis.py << 'EOF'
import pandas as pd
df = pd.read_csv("data.csv")
print(df.describe())
EOF
```
The quotes around `'EOF'` are critical — they suppress variable expansion inside the heredoc. Always use `'EOF'`, never bare `EOF` for code files.

### Append to a file
```bash
cat >> analysis.py << 'EOF'

print("done")
EOF
```

### Read before editing
```bash
cat analysis.py
```
Then rewrite the whole file with `cat > analysis.py << 'EOF'`.

### Check a file exists
```bash
[ -s outputs/plot.png ] && echo "exists and non-empty" || echo "missing"
```

### Create the outputs directory
```bash
mkdir -p /workspace/outputs
```
(Already exists if you used the provided Dockerfile, but safe to call again.)

---

## Handling Long-Running Commands

`bash` is blocking by default. For long jobs:

### Option A: Timeout (simplest)
```bash
timeout 120 python3 train.py
```
Kills after 120 seconds and returns whatever output was produced.

### Option B: Background + log file
```bash
# First call — launch in background
python3 train.py > /workspace/outputs/train.log 2>&1 &
echo "PID: $!"

# Later calls — check progress
tail -20 /workspace/outputs/train.log

# Check if done
grep -i "complete\|error\|done" /workspace/outputs/train.log
```

### Option C: Streaming via MCP

The MCP server can expose a `bash_stream` tool that returns chunks as they arrive using MCP's streaming response support. This requires MCP protocol version ≥ 2025-03-26. For most use cases, Option B (background + log polling) is simpler and sufficient.

---

## Scaling to Multiple Workers

The default in-process session registry works for a single MCP server instance. If you run multiple MCP server instances behind a load balancer, they won't share session state.

### Fix: Redis-backed session registry

Replace the in-memory `_sessions` dict with Redis storing container IDs:

```python
import redis
import docker

r = redis.Redis()
docker_client = docker.from_env()

def get_container(session_id: str):
    cid = r.get(f"sandbox:{session_id}")
    if cid:
        return docker_client.containers.get(cid.decode())
    return None

def register_container(session_id: str, container):
    # 1 hour TTL — safety net if watchdog misses cleanup
    r.set(f"sandbox:{session_id}", container.id, ex=3600)

def remove_session(session_id: str):
    r.delete(f"sandbox:{session_id}")
```

Any MCP server instance can now dispatch commands to any container, since Docker is addressable by container ID from any process with access to the socket.

---

## Common Pitfalls

### Shell state doesn't persist between bash calls
The single most common source of bugs. Each `bash` call is a new shell process.
```bash
# WRONG — second call has no idea about the first
call 1: cd /tmp && export MY_VAR=hello
call 2: echo $MY_VAR    # prints nothing
call 2: pwd             # still /workspace

# RIGHT — chain in one call
call 1: cd /tmp && export MY_VAR=hello && python3 script.py
```

### plt.show() hangs forever
There is no display server inside the container. `plt.show()` blocks waiting for a GUI that will never appear.
```python
# WRONG
plt.show()

# RIGHT
plt.savefig("/workspace/outputs/plot.png", dpi=150)
plt.close()
```

### Interactive tools hang
`nano`, `vim`, `less`, `top`, `python3` (interactive REPL), `ipython` — anything requiring a TTY blocks indefinitely. The agent must never call these.

### Heredoc variable expansion
```bash
# WRONG — $variables get expanded by the outer shell
cat > script.py << EOF
x = "$HOME"
EOF

# RIGHT — quoted delimiter suppresses expansion
cat > script.py << 'EOF'
x = "$HOME"
EOF
```

### Forgetting to read_file before quit_sandbox
The container workdir is deleted on quit. Any plots or outputs not retrieved via `read_file` are gone permanently. The agent should always call `list_files` and `read_file` for anything it wants to preserve before calling `quit_sandbox`.

### Large output flooding context
Printing a large DataFrame or training log directly to stdout bloats the tool result and eats context window fast.
```bash
python3 analysis.py > output.txt 2>&1
head -50 output.txt
wc -l output.txt
```

### Container name collisions
If a container wasn't cleaned up (process crash, etc.) and `create_sandbox` is called again with the same `session_id`, Docker rejects the name. The MCP server handles this by calling `container.remove(force=True)` on the stale container before spawning a new one.

---

## Full MCP Server Code

### `mcp_server.py`

```python
import base64
import mimetypes
import shutil
import threading
import time
from pathlib import Path

import docker
import mcp.server.stdio
from mcp.server import Server
from mcp.types import TextContent, Tool

# ── Config ───────────────────────────────────────────────────────────────────
SANDBOX_IMAGE = "fairsight-sandbox:latest"
HOST_BASE_DIR = "/tmp/fairsight"
IDLE_TIMEOUT = 300  # seconds

# ── Docker client ─────────────────────────────────────────────────────────────
docker_client = docker.from_env()

# ── Session registry ──────────────────────────────────────────────────────────
_sessions: dict = {}  # session_id → {"container": ..., "workdir": Path, "last_used": float}
_lock = threading.Lock()

# ── MCP server ────────────────────────────────────────────────────────────────
server = Server("sandbox")


# ── Internal helpers ──────────────────────────────────────────────────────────

def _touch(session_id: str):
    if session_id in _sessions:
        _sessions[session_id]["last_used"] = time.time()


def _cleanup_stale_container(name: str):
    try:
        docker_client.containers.get(name).remove(force=True)
    except docker.errors.NotFound:
        pass


def _destroy(session_id: str):
    session = _sessions.pop(session_id, None)
    if not session:
        return
    try:
        session["container"].stop(timeout=5)
    except Exception:
        pass
    shutil.rmtree(session["workdir"], ignore_errors=True)


def _start_watchdog(session_id: str):
    def watch():
        while True:
            time.sleep(30)
            with _lock:
                session = _sessions.get(session_id)
                if not session:
                    return
                try:
                    session["container"].reload()
                except Exception:
                    _sessions.pop(session_id, None)
                    return
                if time.time() - session["last_used"] > IDLE_TIMEOUT:
                    _destroy(session_id)
                    return
    threading.Thread(target=watch, daemon=True).start()


# ── Tool implementations ──────────────────────────────────────────────────────

def _create_sandbox(session_id: str, uploaded_file_path: str) -> str:
    with _lock:
        if session_id in _sessions:
            return f"Sandbox already active for session {session_id}."

        workdir = Path(HOST_BASE_DIR) / session_id
        workdir.mkdir(parents=True, exist_ok=True)
        (workdir / "outputs").mkdir(exist_ok=True)
        shutil.copy(uploaded_file_path, workdir)

        name = f"fairsight-{session_id}"
        _cleanup_stale_container(name)

        container = docker_client.containers.run(
            image=SANDBOX_IMAGE,
            command="sleep infinity",
            detach=True,
            volumes={str(workdir): {"bind": "/workspace", "mode": "rw"}},
            working_dir="/workspace",
            mem_limit="2g",
            cpu_quota=100000,
            network_mode="none",
            name=name,
            remove=True,
        )

        _sessions[session_id] = {
            "container": container,
            "workdir": workdir,
            "last_used": time.time(),
        }
        _start_watchdog(session_id)

        filename = Path(uploaded_file_path).name
        return f"Sandbox ready. Container: {name}. File at /workspace/{filename}."


def _bash(session_id: str, command: str) -> str:
    session = _sessions.get(session_id)
    if not session:
        return "Error: no active sandbox for this session. Call create_sandbox first."
    _touch(session_id)
    result = session["container"].exec_run(
        cmd=["bash", "-c", command],
        stdout=True,
        stderr=True,
        workdir="/workspace",
    )
    output = result.output.decode("utf-8", errors="replace")
    if result.exit_code != 0:
        output += f"\n[exit code {result.exit_code}]"
    return output or "(no output)"


def _read_file(session_id: str, file_path: str) -> list:
    session = _sessions.get(session_id)
    if not session:
        return [TextContent(type="text", text="Error: no active sandbox.")]
    _touch(session_id)

    # Map /workspace/outputs/plot.png → /tmp/fairsight/<id>/outputs/plot.png
    rel = file_path.replace("/workspace/", "").lstrip("/")
    host_path = session["workdir"] / rel

    if not host_path.exists():
        return [TextContent(type="text", text=f"Error: file not found: {file_path}")]

    mime, _ = mimetypes.guess_type(str(host_path))
    mime = mime or "application/octet-stream"

    if mime.startswith("text/") or mime in ("application/json",):
        return [TextContent(type="text", text=host_path.read_text(errors="replace"))]
    else:
        b64 = base64.b64encode(host_path.read_bytes()).decode()
        return [TextContent(type="text", text=f"data:{mime};base64,{b64}")]


def _list_files(session_id: str) -> str:
    session = _sessions.get(session_id)
    if not session:
        return "Error: no active sandbox."
    _touch(session_id)
    workdir = session["workdir"]
    files = sorted(p.relative_to(workdir) for p in workdir.rglob("*") if p.is_file())
    return "\n".join(str(f) for f in files) or "(no files)"


def _quit_sandbox(session_id: str) -> str:
    with _lock:
        if session_id not in _sessions:
            return f"No active sandbox for session {session_id}."
        _destroy(session_id)
    return f"Sandbox for session {session_id} destroyed."


# ── MCP tool registration ─────────────────────────────────────────────────────

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="create_sandbox",
            description=(
                "Spawn a Docker container for a session and load the uploaded file into it. "
                "Call this once before any bash or read_file calls."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "uploaded_file_path": {
                        "type": "string",
                        "description": "Absolute path to the file on the host."
                    }
                },
                "required": ["session_id", "uploaded_file_path"]
            }
        ),
        Tool(
            name="bash",
            description=(
                "Run a bash command in the sandbox. Working directory is /workspace. "
                "Shell state does NOT persist between calls. "
                "Never use nano, vim, less, top, or plt.show()."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "command": {"type": "string"}
                },
                "required": ["session_id", "command"]
            }
        ),
        Tool(
            name="read_file",
            description=(
                "Read any file from /workspace in the container. "
                "Text files (.py, .csv, .txt, .json) are returned as plain text. "
                "Binary files (.png, .jpg, .pdf, .pkl) are returned as: data:<mime>;base64,<data>. "
                "Call list_files first to see what exists."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "file_path": {
                        "type": "string",
                        "description": "Full container path, e.g. /workspace/outputs/plot.png"
                    }
                },
                "required": ["session_id", "file_path"]
            }
        ),
        Tool(
            name="list_files",
            description=(
                "List all files in /workspace for a session. "
                "Call after running code to see what was produced."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"}
                },
                "required": ["session_id"]
            }
        ),
        Tool(
            name="quit_sandbox",
            description=(
                "Shut down the container and delete all files. "
                "Call read_file for any outputs you need BEFORE calling this. "
                "Call when fully done."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"}
                },
                "required": ["session_id"]
            }
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "create_sandbox":
        text = _create_sandbox(arguments["session_id"], arguments["uploaded_file_path"])
        return [TextContent(type="text", text=text)]
    elif name == "bash":
        text = _bash(arguments["session_id"], arguments["command"])
        return [TextContent(type="text", text=text)]
    elif name == "read_file":
        return _read_file(arguments["session_id"], arguments["file_path"])
    elif name == "list_files":
        text = _list_files(arguments["session_id"])
        return [TextContent(type="text", text=text)]
    elif name == "quit_sandbox":
        text = _quit_sandbox(arguments["session_id"])
        return [TextContent(type="text", text=text)]
    return [TextContent(type="text", text=f"Unknown tool: {name}")]


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import asyncio
    asyncio.run(mcp.server.stdio.run(server))
```