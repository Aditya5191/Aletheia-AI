import os
import uuid
import subprocess
import asyncio
import json
import shutil
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Dict, Optional
from websockets.exceptions import ConnectionClosedOK, ConnectionClosedError

# Import the agent graph logic
import sys
sys.path.append(os.path.abspath("."))
from agents.graph import run_langgraph_agent

app = FastAPI(title="Lustitia API")

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

def start_docker_sandbox():
    image = "sandbox-python:latest"
    container_name = f"lustitia-api-{uuid.uuid4().hex[:8]}"
    os.makedirs("dataset", exist_ok=True)
    os.makedirs("outputs", exist_ok=True)
    
    data_path = os.path.abspath("dataset/data.csv")
    # Placeholder if file doesn't exist yet
    if not os.path.exists(data_path):
        with open(data_path, "w") as f: f.write("header\nvalue")

    result = subprocess.run([
        "docker", "run", "-d", "--name", container_name,
        "-v", f"{data_path}:/workspace/data.csv",
        "--network", "bridge", image, "tail", "-f", "/dev/null"
    ], capture_output=True, text=True, check=True)
    return result.stdout.strip()

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    os.makedirs("dataset", exist_ok=True)
    file_path = os.path.abspath("dataset/data.csv")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"status": "success", "filename": file.filename}

@app.websocket("/ws/audit")
async def audit_websocket(websocket: WebSocket):
    await websocket.accept()
    
    container_id = None
    mcp_process = None
    
    try:
        container_id = start_docker_sandbox()
        await websocket.send_json({"type": "status", "message": f"Sandbox started: {container_id[:12]}"})
        
        # Start Sandbox MCP
        mcp_process = subprocess.Popen(
            [sys.executable, "mcps/sandbox/mcp_server.py"],
            env={**os.environ, "PORT": "8000"},
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        await asyncio.sleep(3) # Wait for server boot
        
        async for event in run_langgraph_agent(container_id, sandbox_url="http://localhost:8000/sse"):
            try:
                await websocket.send_json(event)
            except (WebSocketDisconnect, ConnectionClosedOK, ConnectionClosedError):
                print("[WS] Client disconnected during event stream.")
                break
        
        # Explicitly signal completion to the frontend
        try:
            await websocket.send_json({"type": "status", "message": "Audit complete."})
            await asyncio.sleep(1) # Give WS time to flush
        except:
            pass
            
    except (WebSocketDisconnect, ConnectionClosedOK, ConnectionClosedError):
        print("[WS] Client disconnected.")
    except Exception as e:
        print(f"[ERROR] Audit failed: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        if mcp_process:
            mcp_process.terminate()
        
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
