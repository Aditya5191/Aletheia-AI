# api.py

import os
import uuid
import subprocess
import asyncio
import json
import shutil
import traceback
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Dict, Optional
from websockets.exceptions import ConnectionClosedOK, ConnectionClosedError

import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")
sys.path.append(os.path.abspath("."))

from backend.model_backend.agents.model_graph import run_model_pipeline
from backend.model_backend.backend import qa as qa_module
from pydantic import BaseModel

DEPLOY_ENV = os.getenv("DEPLOY_ENV", "local")
IS_LOCAL = DEPLOY_ENV == "local"

app = FastAPI(title="Aletheia Model Audit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_sessions: Dict[str, dict] = {}

def cleanup_stale_resources():
    print("[CLEANUP] Cleaning stale sandbox containers and outputs...")
    try:
        result = subprocess.run(
            ["docker", "ps", "-a", "--filter", "name=aletheia-model-", "--format", "{{.ID}}"],
            capture_output=True, text=True, timeout=10
        )
        container_ids = result.stdout.strip().split("\n")
        for cid in container_ids:
            if cid:
                subprocess.run(["docker", "rm", "-f", cid], capture_output=True, timeout=10)
                print(f"[CLEANUP] Removed stale container {cid[:12]}")
    except Exception as e:
        print(f"[CLEANUP] Error cleaning containers: {e}")

    os.makedirs("model_outputs", exist_ok=True)
    for fname in os.listdir("model_outputs"):
        if fname.startswith("model_agent") and (fname.endswith(".json") or fname.endswith(".md")):
            try:
                os.remove(os.path.join("model_outputs", fname))
            except:
                pass
    for fname in os.listdir("model_outputs"):
        if fname.endswith(".png") or fname.endswith(".svg"):
            try:
                os.remove(os.path.join("model_outputs", fname))
            except:
                pass
    print("[CLEANUP] Done.")

cleanup_stale_resources()

app.mount("/model_outputs", StaticFiles(directory="model_outputs"), name="model_outputs")


def start_docker_sandbox():
    image          = "sandbox-python:latest" if IS_LOCAL else "us-central1-docker.pkg.dev/project-f97facc4-90fc-43df-91f/aletheia/sandbox-python:latest"
    container_name = f"aletheia-model-{uuid.uuid4().hex[:8]}"
    os.makedirs("model_upload", exist_ok=True)
    os.makedirs("model_outputs", exist_ok=True)

    result = subprocess.run([
        "docker", "run", "-d", "--name", container_name,
        "--network", "bridge", image, "tail", "-f", "/dev/null"
    ], capture_output=True, text=True, check=True)
    container_id = result.stdout.strip()

    # Copy model file
    model_path  = os.path.abspath("model_upload/model.pkl")
    joblib_path = os.path.abspath("model_upload/model.joblib")

    if os.path.exists(model_path):
        subprocess.run(
            ["docker", "cp", model_path, f"{container_id}:/workspace/model.pkl"],
            check=True
        )
        print("[SANDBOX] Copied model.pkl into container")
    elif os.path.exists(joblib_path):
        subprocess.run(
            ["docker", "cp", joblib_path, f"{container_id}:/workspace/model.joblib"],
            check=True
        )
        print("[SANDBOX] Copied model.joblib into container")
    else:
        raise FileNotFoundError("No model file found. Upload a .pkl or .joblib file first.")

    # Copy sample CSV
    sample_path = os.path.abspath("model_upload/sample.csv")
    if os.path.exists(sample_path):
        subprocess.run(
            ["docker", "cp", sample_path, f"{container_id}:/workspace/sample.csv"],
            check=True
        )
        print("[SANDBOX] Copied sample.csv into container")
    else:
        raise FileNotFoundError("No sample.csv found. Upload a sample CSV file first.")

    # Copy audit_config.json if it exists (optional user column config)
    config_path = os.path.abspath("model_upload/audit_config.json")
    if os.path.exists(config_path):
        subprocess.run(
            ["docker", "cp", config_path, f"{container_id}:/workspace/audit_config.json"],
            check=True
        )
        print("[SANDBOX] Copied audit_config.json into container")

    return container_id


# ─────────────────────────────────────────────────────────────────
# UPLOAD ENDPOINTS
# ─────────────────────────────────────────────────────────────────

@app.post("/upload/model")
async def upload_model(
    file:       UploadFile = File(...),
    model_type: str        = Form("classification")   # "classification" or "regression"
):
    """Accept .pkl or .joblib model files. User must specify model_type."""
    if not file.filename:
        return JSONResponse(status_code=400, content={"status": "error", "message": "No filename provided"})

    fname = file.filename.lower()
    if not (fname.endswith(".pkl") or fname.endswith(".joblib")):
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Only .pkl or .joblib model files are accepted"}
        )

    if model_type not in ("classification", "regression"):
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "model_type must be 'classification' or 'regression'"}
        )

    os.makedirs("model_upload", exist_ok=True)

    ext       = ".pkl" if fname.endswith(".pkl") else ".joblib"
    save_path = os.path.abspath(f"model_upload/model{ext}")
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Persist model_type for the websocket to read later
    with open("model_upload/model_type.txt", "w") as f:
        f.write(model_type)

    file_size = os.path.getsize(save_path)
    return {
        "status":     "success",
        "filename":   file.filename,
        "saved_as":   f"model{ext}",
        "model_type": model_type,
        "size_bytes": file_size
    }


@app.post("/upload/sample")
async def upload_sample(file: UploadFile = File(...)):
    """Accept sample CSV files only."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Only .csv sample files are accepted"}
        )

    os.makedirs("model_upload", exist_ok=True)
    save_path = os.path.abspath("model_upload/sample.csv")
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(save_path)
    return {
        "status":    "success",
        "filename":  file.filename,
        "saved_as":  "sample.csv",
        "size_bytes": file_size
    }


@app.post("/upload/config")
async def upload_config(config: dict):
    """
    Optional. Save user's column configuration before starting audit.
    Accepts: { target_column, protected_attributes }
    """
    os.makedirs("model_upload", exist_ok=True)
    with open("model_upload/audit_config.json", "w") as f:
        json.dump(config, f)
    return {"status": "saved"}


# ─────────────────────────────────────────────────────────────────
# STATUS ENDPOINTS
# ─────────────────────────────────────────────────────────────────

@app.get("/model/status")
async def model_status():
    model_pkl    = os.path.abspath("model_upload/model.pkl")
    model_joblib = os.path.abspath("model_upload/model.joblib")
    sample_csv   = os.path.abspath("model_upload/sample.csv")
    type_file    = os.path.abspath("model_upload/model_type.txt")

    model_exists  = (
        (os.path.exists(model_pkl)    and os.path.getsize(model_pkl)    > 10) or
        (os.path.exists(model_joblib) and os.path.getsize(model_joblib) > 10)
    )
    sample_exists = os.path.exists(sample_csv) and os.path.getsize(sample_csv) > 10
    model_type    = open(type_file).read().strip() if os.path.exists(type_file) else None

    return {
        "model_exists":  model_exists,
        "sample_exists": sample_exists,
        "model_type":    model_type,
        "ready":         model_exists and sample_exists and model_type is not None
    }


@app.get("/model/columns")
async def get_model_columns():
    """Return column names from uploaded sample so frontend can show column selector."""
    sample_path = os.path.abspath("model_upload/sample.csv")
    if not os.path.exists(sample_path):
        return {"columns": []}
    import pandas as pd
    df = pd.read_csv(sample_path, nrows=1)
    return {"columns": df.columns.tolist()}


@app.get("/docker/status/{container_id}")
async def get_docker_status(container_id: str):
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


@app.get("/model_outputs/{filename}")
async def get_output_file(filename: str):
    file_path = os.path.abspath(os.path.join("model_outputs", filename))
    if not file_path.startswith(os.path.abspath("model_outputs")):
        raise HTTPException(status_code=403, detail="Access denied")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")


# ─────────────────────────────────────────────────────────────────
# WEBSOCKET — reads model_type from file, routes to correct pipeline
# ─────────────────────────────────────────────────────────────────

@app.websocket("/ws/model_audit")
async def model_audit_websocket(websocket: WebSocket):
    await websocket.accept()
    print("[WS] Model audit WebSocket accepted...", flush=True)

    # Guard: files must exist
    model_pkl    = os.path.abspath("model_upload/model.pkl")
    model_joblib = os.path.abspath("model_upload/model.joblib")
    sample_csv   = os.path.abspath("model_upload/sample.csv")
    type_file    = os.path.abspath("model_upload/model_type.txt")

    model_exists  = (
        (os.path.exists(model_pkl)    and os.path.getsize(model_pkl)    > 10) or
        (os.path.exists(model_joblib) and os.path.getsize(model_joblib) > 10)
    )
    sample_exists = os.path.exists(sample_csv) and os.path.getsize(sample_csv) > 10

    if not model_exists:
        await websocket.send_json({"type": "error", "message": "No model file uploaded."})
        await websocket.close()
        return

    if not sample_exists:
        await websocket.send_json({"type": "error", "message": "No sample CSV uploaded."})
        await websocket.close()
        return

    if not os.path.exists(type_file):
        await websocket.send_json({"type": "error", "message": "Model type not set. Upload model with model_type field."})
        await websocket.close()
        return

    # Read model_type — determines which prompt set to use
    model_type = open(type_file).read().strip()
    if model_type not in ("classification", "regression"):
        await websocket.send_json({"type": "error", "message": f"Invalid model_type '{model_type}'. Must be classification or regression."})
        await websocket.close()
        return

    print(f"[MODEL AUDIT] model_type={model_type}", flush=True)

    # Agent sender names depend on model_type
    if model_type == "classification":
        sender_to_agent = {
            "MODEL_INSPECTOR":      1,
            "BEHAVIORAL_AUDITOR":   2,
            "THRESHOLD_CALIBRATOR": 3,
            "REPORT_COMPILER":      4,
        }
    else:
        sender_to_agent = {
            "MODEL_PROFILER":      1,
            "DISPARITY_AUDITOR":   2,
            "OUTPUT_RECALIBRATOR": 3,
            "REPORT_COMPILER":     4,
        }

    container_id          = None
    mcp_process           = None
    auditor_process       = None
    miscellaneous_process = None

    code_cells:    Dict[int, list] = {1: [], 2: [], 3: [], 4: []}
    pending_cells: Dict[str, dict] = {}

    def is_error_output(output: str) -> bool:
        if not output:
            return False
        error_signals = [
            "Traceback (most recent call last)", "Error:", "Exception:",
            "SyntaxError", "NameError", "TypeError", "ValueError",
            "KeyError", "IndexError", "AttributeError", "ImportError",
            "ModuleNotFoundError", "FileNotFoundError", "ZeroDivisionError"
        ]
        return any(sig in output for sig in error_signals)

    def save_code_cells(agent_num: int):
        successful = [c for c in code_cells[agent_num] if not is_error_output(c.get("output") or "")]
        path = os.path.join("model_outputs", f"model_agent{agent_num}_code.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(successful, f, indent=2)

    try:
        print("[MODEL AUDIT] Starting...", flush=True)
        cleanup_stale_resources()

        container_id = start_docker_sandbox()
        print(f"[MODEL AUDIT] Sandbox started: {container_id[:12]}", flush=True)
        await websocket.send_json({
            "type":       "status",
            "message":    f"Sandbox started: {container_id[:12]}",
            "model_type": model_type
        })

        # Start MCPs — inherit stdout/stderr so logs flow to the API console
        # (PIPE would deadlock once the buffer fills if nobody reads it)
        mcp_process = subprocess.Popen(
            [sys.executable, "mcps/sandbox/mcp_server.py"],
            env={**os.environ, "PORT": "8000"},
        )
        auditor_process = subprocess.Popen(
            [sys.executable, "mcps/auditor/server.py"],
            env={**os.environ, "PORT": "8001"},
        )
        miscellaneous_process = subprocess.Popen(
            [sys.executable, "mcps/miscellaneous/server.py"],
            env={**os.environ, "PORT": "8002"},
        )

        await asyncio.sleep(3)

        import aiohttp
        mcp_endpoints = [
            ("Sandbox MCP",       mcp_process,          "http://localhost:8000/"),
            ("Auditor MCP",       auditor_process,      "http://localhost:8001/sse"),
            ("Miscellaneous MCP", miscellaneous_process, "http://localhost:8002/sse"),
        ]
        for name, proc, url in mcp_endpoints:
            ready = False
            for attempt in range(15):
                if proc.poll() is not None:
                    raise RuntimeError(f"{name} process exited unexpectedly (check console logs)")
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(url, timeout=aiohttp.ClientTimeout(total=2)) as resp:
                            ready = True
                            print(f"[OK] {name} ready (attempt {attempt+1}, status={resp.status})", flush=True)
                            break
                except Exception:
                    pass
                await asyncio.sleep(2)
            if not ready:
                raise RuntimeError(f"{name} did not become ready after 30 seconds")

        current_sender = None

        # Fix anyio GeneratorExit bug: Run the pipeline in a separate Task and communicate via Queue
        queue = asyncio.Queue()

        async def pipeline_task():
            try:
                async for event in run_model_pipeline(
                    container_id,
                    model_type=model_type,
                    sandbox_url="http://localhost:8000/sse",
                    aletheia_url="http://localhost:8001/sse",
                    miscellaneous_url="http://localhost:8002/sse"
                ):
                    await queue.put(event)
                await queue.put({"__done__": True})
            except asyncio.CancelledError:
                pass
            except Exception as e:
                await queue.put({"type": "error", "message": f"Pipeline error: {e}"})
                await queue.put({"__done__": True})

        task = asyncio.create_task(pipeline_task())

        try:
            while True:
                event = await queue.get()
                if "__done__" in event:
                    break

                await websocket.send_json(event)

                if event.get("sender") and event["sender"] in sender_to_agent:
                    current_sender = event["sender"]

                # Capture execute_cell calls
                if event.get("type") == "tool_calls" and current_sender:
                    agent_num = sender_to_agent.get(current_sender)
                    if agent_num:
                        for tc in event.get("tool_calls", []):
                            if tc.get("name") == "execute_cell":
                                args    = tc.get("args", {})
                                code    = args.get("code", "") if isinstance(args, dict) else ""
                                cell_id = tc.get("id", "")
                                cell    = {"code": code, "output": None}
                                code_cells[agent_num].append(cell)
                                pending_cells[cell_id] = cell
                                save_code_cells(agent_num)

                # Capture execute_cell results
                if event.get("type") == "tool_result" and event.get("name") == "execute_cell":
                    output  = event.get("content", "")
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

                # After Agent 1 finishes, extract model_attributes.json
                agent1_sender = (
                    "MODEL_INSPECTOR" if model_type == "classification"
                    else "MODEL_PROFILER"
                )
                if event.get("sender") == agent1_sender and event.get("type") == "message":
                    try:
                        read_proc = subprocess.run(
                            ["docker", "exec", container_id, "cat",
                             "/workspace/outputs/model_attributes.json"],
                            capture_output=True, text=True
                        )
                        if read_proc.returncode == 0:
                            attr_data = json.loads(read_proc.stdout)
                            await websocket.send_json({
                                "type":       "attributes_discovered",
                                "attributes": attr_data.get("protected_attributes", []),
                                "task_type":  attr_data.get("task_type", model_type)
                            })
                    except Exception as e:
                        print(f"[ERROR] Failed to read model_attributes.json: {e}")

                # Sync outputs after every tool result
                if event.get("type") == "tool_result" and container_id:
                    try:
                        subprocess.run(
                            ["docker", "cp",
                             f"{container_id}:/workspace/outputs/.", "model_outputs/"],
                            capture_output=True, timeout=10
                        )
                    except Exception:
                        pass

        except (WebSocketDisconnect, ConnectionClosedOK, ConnectionClosedError):
            print("[WS] Client disconnected during event stream.")
            task.cancel()

        for agent_num in [1, 2, 3, 4]:
            if code_cells[agent_num]:
                save_code_cells(agent_num)

        try:
            await websocket.send_json({"type": "status", "message": f"{model_type.title()} model audit complete."})
            await asyncio.sleep(1)
        except:
            pass

    except (WebSocketDisconnect, ConnectionClosedOK, ConnectionClosedError) as e:
        print(f"[WS] Client disconnected: {e}", flush=True)
        del active_sessions[session_id]
        print(f"[WS] Cleaned up session {session_id}")


    except RuntimeError as e:
        print(f"[WS] Runtime error: {e}", flush=True)
        import traceback as tb
        tb.print_exc()
    except Exception as e:
        full_tb = traceback.format_exc()
        print(f"[ERROR] Model audit failed: {e}")
        print(f"[ERROR] Full traceback:\n{full_tb}")
        if hasattr(e, 'exceptions'):
            for i, sub_e in enumerate(e.exceptions):
                print(f"[ERROR] Sub-exception {i}: {sub_e}")
                print(f"[ERROR] Sub-traceback {i}:\n{''.join(traceback.format_exception(type(sub_e), sub_e, sub_e.__traceback__))}")
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
            os.makedirs("model_outputs", exist_ok=True)
            subprocess.run(
                ["docker", "cp", f"{container_id}:/workspace/outputs/.", "model_outputs/"],
                capture_output=True
            )
            print(f"[CLEANUP] Removing container {container_id[:12]}...")
            subprocess.run(["docker", "rm", "-f", container_id], capture_output=True)

        try:
            await websocket.close()
        except:
            pass


@app.get("/model_outputs")
async def list_model_outputs():
    os.makedirs("model_outputs", exist_ok=True)
    return {"files": os.listdir("model_outputs")}


os.makedirs("model_outputs", exist_ok=True)



class QaAskRequest(BaseModel):
    question: str
    agent_numbers: list[int]
    test_mode: bool = False
    view_type: str = "model"

@app.get("/qa/agents")
async def qa_agents(test_mode: bool = False, view_type: str = "model"):
    """Report which agents currently have output on disk, for the Ask sidebar checkboxes."""
    context = qa_module.get_available_agent_context(test_mode=test_mode, view_type=view_type)
    return {
        str(num): {"name": info["name"], "available": info["available"]}
        for num, info in context.items()
    }

@app.post("/qa/ask")
async def qa_ask(req: QaAskRequest):
    """Stream a natural-language answer grounded in the selected agents' on-disk reports."""
    async def event_stream():
        try:
            async for piece in qa_module.stream_answer(req.question, req.agent_numbers, test_mode=req.test_mode, view_type=req.view_type):
                yield f"data: {json.dumps({'text': piece})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
    from fastapi.responses import StreamingResponse
    return StreamingResponse(event_stream(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)