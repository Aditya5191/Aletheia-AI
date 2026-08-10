# api.py — Aletheia BiasProbe API
#
# Lightweight FastAPI service (no Docker sandbox needed — BiasProbe is just
# HTTP calls out to Gemini and a user-supplied target endpoint) that runs the
# BiasProbe pipeline and streams progress over a WebSocket.

import asyncio
import os
import sys
import traceback
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ValidationError
from websockets.exceptions import ConnectionClosedError, ConnectionClosedOK
# Resolve the path dynamically so it works no matter where the user runs this script from
import pathlib
root_dir = pathlib.Path(__file__).resolve().parent.parent.parent.parent

# Force load the root .env file
load_dotenv(dotenv_path=root_dir / ".env", override=True)

# The user is using `gcloud auth application-default login` (ADC).
# We must clear GOOGLE_APPLICATION_CREDENTIALS in case their PowerShell session
# has an old/stale path exported, otherwise Vertex AI will try to load it and crash.
if "GOOGLE_APPLICATION_CREDENTIALS" in os.environ:
    del os.environ["GOOGLE_APPLICATION_CREDENTIALS"]

sys.path.append(str(root_dir))
sys.path.append(str(root_dir / "biasprobe"))

from biasprobe import counterfactual_builder, judge, scenario_generator, target_runner
from biasprobe import report as report_mod
from biasprobe.connectors import build_connector
from biasprobe.schemas import BiasProbeRunRequest, TargetEndpointConfig

app = FastAPI(title="Aletheia BiasProbe API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUTS_DIR = "biasprobe_outputs"
os.makedirs(OUTPUTS_DIR, exist_ok=True)
app.mount("/biasprobe_outputs", StaticFiles(directory=OUTPUTS_DIR), name="biasprobe_outputs")

TEST_PROMPT = "Reply with the single word: pong"


class TestConnectionRequest(BaseModel):
    endpoint: TargetEndpointConfig


@app.post("/biasprobe/test-connection")
async def test_connection(req: TestConnectionRequest):
    """Fire one throwaway prompt at a target endpoint config and report what
    came back — lets the UI validate a custom request_template/response_path
    before committing to a real run."""
    try:
        connector = build_connector(req.endpoint)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    loop = asyncio.get_event_loop()
    try:
        raw_text = await loop.run_in_executor(None, connector.generate, TEST_PROMPT)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    return {"status": "ok", "extracted_text": raw_text}


@app.websocket("/ws/biasprobe")
async def biasprobe_websocket(websocket: WebSocket):
    await websocket.accept()

    try:
        raw_config = await websocket.receive_json()
        run_request = BiasProbeRunRequest(**raw_config)
    except ValidationError as e:
        await websocket.send_json({"type": "biasprobe_error", "message": f"Invalid run config: {e}"})
        await websocket.close()
        return
    except (WebSocketDisconnect, ConnectionClosedOK, ConnectionClosedError):
        return
    except Exception as e:
        await websocket.send_json({"type": "biasprobe_error", "message": str(e)})
        await websocket.close()
        return

    try:
        connector = build_connector(run_request.endpoint)
    except ValueError as e:
        await websocket.send_json({"type": "biasprobe_error", "message": str(e)})
        await websocket.close()
        return

    run_id = uuid.uuid4().hex[:12]
    loop = asyncio.get_event_loop()

    def emit(payload: dict) -> None:
        """Thread-safe send — target_runner/judge run their sync HTTP loops
        in a worker thread via run_in_executor, but only the event loop
        thread is allowed to touch the websocket."""
        asyncio.run_coroutine_threadsafe(websocket.send_json(payload), loop)

    try:
        await websocket.send_json({"type": "biasprobe_stage", "stage": "generating_scenarios"})
        scenarios, dimension_variants = await loop.run_in_executor(
            None,
            scenario_generator.generate_scenarios,
            run_request.use_case,
            run_request.dimensions,
            run_request.num_scenarios,
            run_request.variants_per_dimension,
        )
        await websocket.send_json({
            "type": "biasprobe_scenarios",
            "scenarios": [s.model_dump() for s in scenarios],
            "dimensions": list(dimension_variants.keys()),
        })

        await websocket.send_json({"type": "biasprobe_stage", "stage": "building_counterfactuals"})
        counterfactuals = counterfactual_builder.build_counterfactuals(scenarios, dimension_variants)

        await websocket.send_json({
            "type": "biasprobe_stage", "stage": "running_target", "total": len(counterfactuals),
        })

        def on_target_item(response, completed, total):
            emit({
                "type": "biasprobe_target_response", "response": response.model_dump(),
                "completed": completed, "total": total,
            })

        responses = await loop.run_in_executor(
            None, target_runner.run_all_targets, connector, counterfactuals, on_target_item
        )

        num_groups = len({(r.scenario_id, r.dimension) for r in responses})
        await websocket.send_json({
            "type": "biasprobe_stage", "stage": "judging", "total": num_groups,
        })

        def on_judge_item(verdict, completed, total):
            emit({
                "type": "biasprobe_verdict", "verdict": verdict.model_dump(),
                "completed": completed, "total": total,
            })

        verdicts = await loop.run_in_executor(
            None, judge.judge_all, scenarios, responses, on_judge_item
        )

        await websocket.send_json({"type": "biasprobe_stage", "stage": "aggregating"})
        report = report_mod.build_report(
            run_request.use_case, run_request.endpoint.model_id, scenarios, responses, verdicts
        )

        run_dir = os.path.join(OUTPUTS_DIR, run_id)
        os.makedirs(run_dir, exist_ok=True)
        report_mod.write_report(report, os.path.join(run_dir, "report.json"))

        await websocket.send_json({
            "type": "biasprobe_report", "run_id": run_id, "report": report.model_dump(),
        })
        await websocket.send_json({"type": "biasprobe_stage", "stage": "done"})

    except (WebSocketDisconnect, ConnectionClosedOK, ConnectionClosedError):
        print("[WS] BiasProbe client disconnected mid-run.", flush=True)
    except Exception as e:
        traceback.print_exc()
        try:
            await websocket.send_json({"type": "biasprobe_error", "message": str(e)})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


@app.get("/biasprobe/runs")
async def list_runs():
    """Past run ids that still have a report.json on disk."""
    if not os.path.isdir(OUTPUTS_DIR):
        return {"runs": []}
    runs = [
        d for d in os.listdir(OUTPUTS_DIR)
        if os.path.exists(os.path.join(OUTPUTS_DIR, d, "report.json"))
    ]
    return {"runs": runs}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8007)
