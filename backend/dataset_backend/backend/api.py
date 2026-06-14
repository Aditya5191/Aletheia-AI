import os
import uuid
import subprocess
import asyncio
import json
import shutil
import traceback
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks, HTTPException, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Dict, Optional
from websockets.exceptions import ConnectionClosedOK, ConnectionClosedError
from dotenv import load_dotenv

load_dotenv(override=True)

# Import the agent graph logic
import sys
sys.path.append(os.path.abspath("."))
from backend.dataset_backend.agents.graph import run_langgraph_agent

# ── Environment config ────────────────────────────────────────────────────────
DEPLOY_ENV        = os.getenv("DEPLOY_ENV", "local")          # "local" | "prod"
IS_LOCAL          = DEPLOY_ENV == "local"

SANDBOX_MCP_PORT  = int(os.getenv("SANDBOX_MCP_PORT", "8000"))
AUDITOR_MCP_PORT  = int(os.getenv("AUDITOR_MCP_PORT", "8001"))
MISC_MCP_PORT     = int(os.getenv("MISC_MCP_PORT",    "8002"))

# In local mode always use localhost — the *_MCP_URL vars are prod-only
if IS_LOCAL:
    SANDBOX_MCP_URL = f"http://localhost:{SANDBOX_MCP_PORT}/sse"
    AUDITOR_MCP_URL = f"http://localhost:{AUDITOR_MCP_PORT}/sse"
    MISC_MCP_URL    = f"http://localhost:{MISC_MCP_PORT}/sse"
else:
    SANDBOX_MCP_URL = os.getenv("SANDBOX_MCP_URL", f"http://localhost:{SANDBOX_MCP_PORT}/sse")
    AUDITOR_MCP_URL = os.getenv("AUDITOR_MCP_URL", f"http://localhost:{AUDITOR_MCP_PORT}/sse")
    MISC_MCP_URL    = os.getenv("MISC_MCP_URL",    f"http://localhost:{MISC_MCP_PORT}/sse")

print(f"[CONFIG] DEPLOY_ENV={DEPLOY_ENV}")
print(f"[CONFIG] Sandbox MCP  → {SANDBOX_MCP_URL}")
print(f"[CONFIG] Auditor MCP  → {AUDITOR_MCP_URL}")
print(f"[CONFIG] Misc MCP     → {MISC_MCP_URL}")

app = FastAPI(title="Aletheia API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state to track active sessions (if needed)
active_sessions: Dict[str, dict] = {}

def cleanup_stale_resources():
    """Remove any leftover sandbox containers and clear stale outputs.
    Handles the case where a user reloads mid-audit."""
    print("[CLEANUP] Cleaning stale sandbox containers and outputs...")
    # Kill and remove all aletheia sandbox containers
    try:
        result = subprocess.run(
            ["docker", "ps", "-a", "--filter", "name=aletheia-api-", "--format", "{{.ID}}"],
            capture_output=True, text=True, timeout=10
        )
        container_ids = result.stdout.strip().split("\n")
        for cid in container_ids:
            if cid:
                subprocess.run(["docker", "rm", "-f", cid], capture_output=True, timeout=10)
                print(f"[CLEANUP] Removed stale container {cid[:12]}")
    except Exception as e:
        print(f"[CLEANUP] Error cleaning containers: {e}")
    
    # Clear stale agent outputs
    os.makedirs("outputs", exist_ok=True)
    for fname in os.listdir("outputs"):
        if fname.startswith("agent") and (fname.endswith(".json") or fname.endswith(".md")):
            try:
                os.remove(os.path.join("outputs", fname))
            except:
                pass
    # Also clear any leftover chart images
    for fname in os.listdir("outputs"):
        if fname.endswith(".png") or fname.endswith(".svg"):
            try:
                os.remove(os.path.join("outputs", fname))
            except:
                pass
    print("[CLEANUP] Done.")

# Clean up on startup
cleanup_stale_resources()

def start_docker_sandbox():
    image = "us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/sandbox-python:latest"
    container_name = f"aletheia-api-{uuid.uuid4().hex[:8]}"
    os.makedirs("dataset", exist_ok=True)
    os.makedirs("outputs", exist_ok=True)
    
    # Start container without volume mounts (Docker-in-Docker can't map container paths)
    result = subprocess.run([
        "docker", "run", "-d", "--name", container_name,
        "--network", "bridge", image, "tail", "-f", "/dev/null"
    ], capture_output=True, text=True, check=True)
    container_id = result.stdout.strip()
    
    # Copy dataset and metadata into the sandbox container
    data_path = os.path.abspath("dataset/data.csv")
    if os.path.exists(data_path):
        subprocess.run(["docker", "cp", data_path, f"{container_id}:/workspace/data.csv"], check=True)

    metadata_path = os.path.abspath("dataset/metadata.json")
    if os.path.exists(metadata_path):
        subprocess.run(["docker", "cp", metadata_path, f"{container_id}:/workspace/metadata.json"], check=True)

    return container_id

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    description: str = Form(""),
    target_column: str = Form(""),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Only .csv files are accepted"}
        )

    os.makedirs("dataset", exist_ok=True)
    file_path = os.path.abspath("dataset/data.csv")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Persist user-supplied metadata alongside the dataset
    metadata = {"description": description.strip(), "target_column": target_column.strip()}
    metadata_path = os.path.abspath("dataset/metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    file_size = os.path.getsize(file_path)
    return {
        "status": "success",
        "filename": file.filename,
        "saved_as": "data.csv",
        "size_bytes": file_size,
        "target_column": target_column.strip(),
    }

@app.get("/dataset/status")
async def dataset_status():
    """Check if a dataset already exists."""
    file_path = os.path.abspath("dataset/data.csv")
    if os.path.exists(file_path) and os.path.getsize(file_path) > 10:
        size = os.path.getsize(file_path)
        return {"exists": True, "filename": "data.csv", "size_bytes": size}
    return {"exists": False}

@app.get("/docker/status/{container_id}")
async def get_docker_status(container_id: str):
    """Check if a docker container is currently running."""
    try:
        process = await asyncio.create_subprocess_exec(
            "docker", "inspect", "-f", "{{.State.Running}}", container_id,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode == 0:
            is_running = stdout.decode().strip().lower() == "true"
            return {"status": "running" if is_running else "stopped"}
        else:
            return {"status": "stopped", "error": "Container not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/outputs/{filename}")
async def get_output_file(filename: str):
    """Serve generated JSON files or plots from the outputs directory."""
    file_path = os.path.abspath(os.path.join("outputs", filename))
    # Security check to prevent path traversal
    if not file_path.startswith(os.path.abspath("outputs")):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

@app.websocket("/ws/audit")
async def audit_websocket(websocket: WebSocket):
    await websocket.accept()
    print("[WS] WebSocket accepted, entering handler...", flush=True)
    
    # Guard: ensure dataset exists before starting
    data_path = os.path.abspath("dataset/data.csv")
    print(f"[WS] Checking dataset at: {data_path}, exists={os.path.exists(data_path)}, size={os.path.getsize(data_path) if os.path.exists(data_path) else 0}", flush=True)
    if not os.path.exists(data_path) or os.path.getsize(data_path) < 10:
        print("[WS] Dataset check FAILED - closing connection", flush=True)
        await websocket.send_json({
            "type": "error",
            "message": "No dataset uploaded. Please upload a CSV file first."
        })
        await websocket.close()
        return
    
    container_id = None
    mcp_process = None
    auditor_process = None
    miscellaneous_process = None
    
    # Track code cells per agent for the Code tab
    sender_to_agent = {
        "DATA_SURVEYOR": 1,
        "FAIRNESS_ADJUDICATOR": 2,
        "MITIGATION_AGENT": 3,
        "REPORT_COMPILER": 4,
    }
    code_cells: Dict[int, list] = {1: [], 2: [], 3: [], 4: []}
    # Track pending execute_cell calls awaiting their tool_result
    pending_cells: Dict[str, dict] = {}
    
    def is_error_output(output: str) -> bool:
        """Check if a cell output indicates an execution error."""
        if not output:
            return False
        error_signals = ["Traceback (most recent call last)", "Error:", "Exception:", "SyntaxError", "NameError", "TypeError", "ValueError", "KeyError", "IndexError", "AttributeError", "ImportError", "ModuleNotFoundError", "FileNotFoundError", "ZeroDivisionError"]
        return any(sig in output for sig in error_signals)
    
    def save_code_cells(agent_num: int):
        """Persist only successfully executed code cells to outputs/agentN_code.json"""
        successful = [c for c in code_cells[agent_num] if not is_error_output(c.get("output") or "")]
        path = os.path.join("outputs", f"agent{agent_num}_code.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(successful, f, indent=2)
    
    try:
        # Clean up any stale containers/outputs from previous runs (handles mid-audit reload)
        print("[AUDIT] Starting audit websocket handler...", flush=True)
        cleanup_stale_resources()
        
        print("[AUDIT] Starting Docker sandbox...", flush=True)
        container_id = start_docker_sandbox()
        print(f"[AUDIT] Sandbox started: {container_id[:12]}", flush=True)
        await websocket.send_json({"type": "status", "message": f"Sandbox started: {container_id[:12]}"})
        
        import aiohttp

        if IS_LOCAL:
            # ── Local mode: spawn MCP servers as subprocesses ──────────────────
            # Sandbox MCP: inherit stdout/stderr so sandbox logs appear in the backend console
            mcp_process = subprocess.Popen(
                [sys.executable, "mcps/sandbox/mcp_server.py"],
                env={**os.environ, "PORT": str(SANDBOX_MCP_PORT)},
                stdout=None,   # inherit — sandbox logs print directly to terminal
                stderr=None
            )
            auditor_process = subprocess.Popen(
                [sys.executable, "mcps/auditor/server.py"],
                env={**os.environ, "PORT": str(AUDITOR_MCP_PORT)},
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            miscellaneous_process = subprocess.Popen(
                [sys.executable, "mcps/miscellaneous/server.py"],
                env={**os.environ, "PORT": str(MISC_MCP_PORT)},
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

            await asyncio.sleep(3)

            # Verify each local MCP is up
            mcp_endpoints = [
                ("Sandbox MCP",      mcp_process,           f"http://localhost:{SANDBOX_MCP_PORT}/"),
                ("Auditor MCP",      auditor_process,        f"http://localhost:{AUDITOR_MCP_PORT}/sse"),
                ("Miscellaneous MCP", miscellaneous_process, f"http://localhost:{MISC_MCP_PORT}/sse"),
            ]
            for name, proc, url in mcp_endpoints:
                ready = False
                for attempt in range(15):
                    if proc.poll() is not None:
                        stderr_out = proc.stderr.read().decode() if proc.stderr else "(no stderr pipe)"
                        print(f"[ERROR] {name} crashed (exit {proc.returncode}): {stderr_out}", flush=True)
                        raise RuntimeError(f"{name} failed to start: {stderr_out[:500]}")
                    try:
                        async with aiohttp.ClientSession() as session:
                            async with session.get(url, timeout=aiohttp.ClientTimeout(total=2)) as resp:
                                ready = True
                                print(f"[OK] {name} ready (PID {proc.pid}, attempt {attempt+1}, status={resp.status})", flush=True)
                                break
                    except Exception:
                        pass
                    await asyncio.sleep(2)
                if not ready:
                    raise RuntimeError(f"{name} did not become ready after 30 seconds")
        else:
            # ── Prod mode: MCPs are already running at their dedicated URLs ────
            print("[CONFIG] Prod mode — verifying dedicated MCP endpoints...", flush=True)
            mcp_endpoints_prod = [
                ("Sandbox MCP",       SANDBOX_MCP_URL.replace("/sse", "/")),
                ("Auditor MCP",       AUDITOR_MCP_URL),
                ("Miscellaneous MCP", MISC_MCP_URL),
            ]
            for name, url in mcp_endpoints_prod:
                ready = False
                for attempt in range(10):
                    try:
                        async with aiohttp.ClientSession() as session:
                            async with session.get(url, timeout=aiohttp.ClientTimeout(total=3)) as resp:
                                ready = True
                                print(f"[OK] {name} reachable (attempt {attempt+1}, status={resp.status})", flush=True)
                                break
                    except Exception:
                        pass
                    await asyncio.sleep(2)
                if not ready:
                    raise RuntimeError(f"{name} not reachable at {url}")

        
        current_sender = None
        
        async for event in run_langgraph_agent(
            container_id,
            sandbox_url=SANDBOX_MCP_URL,
            aletheia_url=AUDITOR_MCP_URL,
            miscellaneous_url=MISC_MCP_URL,
        ):
            try:
                await websocket.send_json(event)
                
                # Track which agent is currently active
                if event.get("sender") and event["sender"] in sender_to_agent:
                    current_sender = event["sender"]
                
                # --- Capture execute_cell code from tool_calls ---
                if event.get("type") == "tool_calls" and current_sender:
                    agent_num = sender_to_agent.get(current_sender)
                    if agent_num:
                        for tc in event.get("tool_calls", []):
                            if tc.get("name") == "execute_cell":
                                args = tc.get("args", {})
                                code = args.get("code", "") if isinstance(args, dict) else ""
                                cell_id = tc.get("id", "")
                                cell = {"code": code, "output": None}
                                code_cells[agent_num].append(cell)
                                # Track by tool call ID so we can match the result
                                pending_cells[cell_id] = cell
                                save_code_cells(agent_num)
                
                # --- Capture tool results for execute_cell ---
                if event.get("type") == "tool_result" and event.get("name") == "execute_cell":
                    # Match output to the most recent pending cell
                    output = event.get("content", "")
                    # Try to find and fill the most recent unfilled cell
                    matched = False
                    for cid, cell in reversed(list(pending_cells.items())):
                        if cell["output"] is None:
                            cell["output"] = output
                            del pending_cells[cid]
                            matched = True
                            break
                    if matched and current_sender:
                        agent_num = sender_to_agent.get(current_sender)
                        if agent_num:
                            save_code_cells(agent_num)
                
                # Check if Agent 1 (Data Surveyor) just finished to extract attributes
                if event.get("sender") == "DATA_SURVEYOR" and event.get("type") == "message":
                    # Run docker exec to read attributes.json
                    try:
                        read_proc = subprocess.run(
                            ["docker", "exec", container_id, "cat", "/workspace/outputs/attributes.json"],
                            capture_output=True, text=True
                        )
                        if read_proc.returncode == 0:
                            attr_data = json.loads(read_proc.stdout)
                            await websocket.send_json({
                                "type": "attributes_discovered",
                                "attributes": attr_data.get("protected_attributes", [])
                            })
                    except Exception as e:
                        print(f"[ERROR] Failed to read attributes.json: {e}")

                # Sync outputs from sandbox container after every tool result
                if event.get("type") == "tool_result" and container_id:
                    try:
                        subprocess.run(
                            ["docker", "cp", f"{container_id}:/workspace/outputs/.", "outputs/"],
                            capture_output=True, timeout=10
                        )
                    except Exception:
                        pass

            except (WebSocketDisconnect, ConnectionClosedOK, ConnectionClosedError):
                print("[WS] Client disconnected during event stream.")
                break
        
        # Save final code cells for all agents
        for agent_num in [1, 2, 3, 4]:
            if code_cells[agent_num]:
                save_code_cells(agent_num)
        
        # Explicitly signal completion to the frontend
        try:
            await websocket.send_json({"type": "status", "message": "Audit complete."})
            await asyncio.sleep(1) # Give WS time to flush
        except:
            pass
            
    except (WebSocketDisconnect, ConnectionClosedOK, ConnectionClosedError) as e:
        print(f"[WS] Client disconnected: {e}", flush=True)
    except RuntimeError as e:
        print(f"[WS] Runtime error: {e}", flush=True)
        import traceback as tb
        tb.print_exc()
    except Exception as e:
        full_tb = traceback.format_exc()
        print(f"[ERROR] Audit failed: {e}")
        print(f"[ERROR] Full traceback:\n{full_tb}")
        # Also print sub-exceptions for ExceptionGroups
        if hasattr(e, 'exceptions'):
            for i, sub_e in enumerate(e.exceptions):
                print(f"[ERROR] Sub-exception {i}: {sub_e}")
                print(f"[ERROR] Sub-traceback {i}:\n{''.join(traceback.format_exception(type(sub_e), sub_e, sub_e.__traceback__))}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        # Only terminate if we spawned them (local mode)
        if IS_LOCAL:
            if mcp_process:
                mcp_process.terminate()
            if auditor_process:
                auditor_process.terminate()
            if miscellaneous_process:
                miscellaneous_process.terminate()
        
        if container_id:
            print(f"[CLEANUP] Syncing outputs from {container_id[:12]}...")
            # Ensure the outputs directory exists on the host
            os.makedirs("outputs", exist_ok=True)
            # Sync outputs back to host BEFORE removing container
            subprocess.run(["docker", "cp", f"{container_id}:/workspace/outputs/.", "outputs/"], capture_output=True)
            print(f"[CLEANUP] Removing container {container_id[:12]}...")
            subprocess.run(["docker", "rm", "-f", container_id], capture_output=True)
        
        try:
            await websocket.close()
        except:
            pass


@app.get("/outputs")
async def list_outputs():
    os.makedirs("outputs", exist_ok=True)
    files = os.listdir("outputs")
    return {"files": files}

# Serve generated outputs (plots/markdown)
os.makedirs("outputs", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
