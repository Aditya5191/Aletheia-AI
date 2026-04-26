import os
import uuid
import subprocess
import asyncio
import json
import shutil
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Dict, Optional
from websockets.exceptions import ConnectionClosedOK, ConnectionClosedError

# Import the agent graph logic
import sys
sys.path.append(os.path.abspath("."))
from agents.graph import run_langgraph_agent

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

# Clear stale agent outputs on startup
os.makedirs("outputs", exist_ok=True)
for _fname in os.listdir("outputs"):
    if _fname.startswith("agent") and (_fname.endswith(".json") or _fname.endswith(".md")):
        os.remove(os.path.join("outputs", _fname))

app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

def start_docker_sandbox():
    image = "sandbox-python:latest"
    container_name = f"aletheia-api-{uuid.uuid4().hex[:8]}"
    os.makedirs("dataset", exist_ok=True)
    os.makedirs("outputs", exist_ok=True)
    
    data_path = os.path.abspath("dataset/data.csv")

    outputs_path = os.path.abspath("outputs")

    result = subprocess.run([
        "docker", "run", "-d", "--name", container_name,
        "-v", f"{data_path}:/workspace/data.csv",
        "-v", f"{outputs_path}:/workspace/outputs",
        "--network", "bridge", image, "tail", "-f", "/dev/null"
    ], capture_output=True, text=True, check=True)
    return result.stdout.strip()

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Only accept CSV files
    if not file.filename or not file.filename.lower().endswith(".csv"):
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Only .csv files are accepted"}
        )
    
    os.makedirs("dataset", exist_ok=True)
    # Always save as data.csv — this is what gets mounted into Docker
    file_path = os.path.abspath("dataset/data.csv")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)
    return {
        "status": "success",
        "filename": file.filename,
        "saved_as": "data.csv",
        "size_bytes": file_size
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
    
    # Guard: ensure dataset exists before starting
    data_path = os.path.abspath("dataset/data.csv")
    if not os.path.exists(data_path) or os.path.getsize(data_path) < 10:
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
    }
    code_cells: Dict[int, list] = {1: [], 2: [], 3: []}
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
        # Clear stale outputs from previous runs
        os.makedirs("outputs", exist_ok=True)
        for fname in os.listdir("outputs"):
            if fname.startswith("agent") and (fname.endswith(".json") or fname.endswith(".md")):
                os.remove(os.path.join("outputs", fname))
        
        container_id = start_docker_sandbox()
        await websocket.send_json({"type": "status", "message": f"Sandbox started: {container_id[:12]}"})
        
        # Start Sandbox MCP
        mcp_process = subprocess.Popen(
            [sys.executable, "mcps/sandbox/mcp_server.py"],
            env={**os.environ, "PORT": "8000"},
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # Start Auditor MCP locally to avoid Railway timeouts
        auditor_process = subprocess.Popen(
            [sys.executable, "mcps/auditor/server.py"],
            env={**os.environ, "PORT": "8001"},
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # Start Miscellaneous MCP locally
        miscellaneous_process = subprocess.Popen(
            [sys.executable, "mcps/miscellaneous/server.py"],
            env={**os.environ, "PORT": "8002"},
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        await asyncio.sleep(3) # Wait for server boot
        
        current_sender = None
        
        async for event in run_langgraph_agent(
            container_id, 
            sandbox_url="http://localhost:8000/sse", 
            aletheia_url="http://localhost:8001/sse",
            miscellaneous_url="http://localhost:8002/sse"
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

            except (WebSocketDisconnect, ConnectionClosedOK, ConnectionClosedError):
                print("[WS] Client disconnected during event stream.")
                break
        
        # Save final code cells for all agents
        for agent_num in [1, 2, 3]:
            if code_cells[agent_num]:
                save_code_cells(agent_num)
        
        # Explicitly signal completion to the frontend
        try:
            await websocket.send_json({"type": "status", "message": "Audit complete."})
            await asyncio.sleep(1) # Give WS time to flush
        except:
            pass
            
    except (WebSocketDisconnect, ConnectionClosedOK, ConnectionClosedError):
        print("[WS] Client disconnected.")
    except RuntimeError as e:
        print(f"[WS] Runtime error during cleanup (safe to ignore): {e}")
    except Exception as e:
        print(f"[ERROR] Audit failed: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
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
