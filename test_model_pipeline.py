import asyncio
import subprocess
import os
import sys
import uuid
import time

def start_docker_sandbox():
    """Starts an ephemeral docker container mapping data, model and sample and returns its ID."""
    image = "sandbox-python:latest"
    container_name = f"aletheia-sandbox-{uuid.uuid4().hex[:8]}"
    print(f"[DOCKER] Starting ephemeral container {container_name} from {image}...")
    
    # Ensure local outputs directory exists
    os.makedirs("outputs", exist_ok=True)
    
    # Generate test assets if they don't exist
    if not os.path.exists("classification_model_testing/lending_model.pkl") or not os.path.exists("classification_model_testing/lending_sample.csv"):
        print("[SETUP] Generating complex lending model and sample...")
        subprocess.run([sys.executable, "generate_lending_assets.py"], check=True)

    data_path = os.path.abspath("dataset/data.csv")
    model_path = os.path.abspath("classification_model_testing/lending_model.pkl")
    sample_path = os.path.abspath("classification_model_testing/lending_sample.csv")
    
    try:
        # Mount the model and sample CSV into the sandbox root
        result = subprocess.run([
            "docker", "run", "-d", "--name", container_name,
            "-v", f"{data_path}:/workspace/data.csv",
            "-v", f"{model_path}:/workspace/lending_model.pkl",
            "-v", f"{sample_path}:/workspace/lending_sample.csv",
            "--network", "bridge", image, "tail", "-f", "/dev/null"
        ], capture_output=True, text=True, check=True)
        container_id = result.stdout.strip()
        print(f"[DOCKER] Container started successfully. ID: {container_id[:12]}")
        return container_id
    except subprocess.CalledProcessError as e:
        print(f"[DOCKER] Failed to start. Error: {e.stderr}")
        sys.exit(1)

def run_test():
    container_id = start_docker_sandbox()
    
    print("[MCP] Starting Sandbox MCP Server on port 8000...")
    mcp_process = subprocess.Popen(
        [sys.executable, os.path.join("mcps", "sandbox", "mcp_server.py")],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    print("[MCP] Starting Miscellaneous MCP Server on port 8002...")
    misc_env = os.environ.copy()
    misc_env["PORT"] = "8002"
    misc_mcp_process = subprocess.Popen(
        [sys.executable, os.path.join("mcps", "miscellaneous", "server.py")],
        env=misc_env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    print("[MCP] Starting Auditor MCP Server on port 8001...")
    auditor_env = os.environ.copy()
    auditor_env["PORT"] = "8001"
    auditor_mcp_process = subprocess.Popen(
        [sys.executable, os.path.join("mcps", "auditor", "server.py")],
        env=auditor_env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    time.sleep(3)
    
    try:
        sys.path.append(os.path.abspath("backend/model_backend"))
        # Import the correct model pipeline function
        from agents.model_graph import run_model_pipeline
        
        async def main():
            # Run the generator
            async for event in run_model_pipeline(
                container_id,
                sandbox_url="http://localhost:8000/sse",
                aletheia_url="http://localhost:8001/sse",
                miscellaneous_url="http://localhost:8002/sse"
            ):
                pass # The streaming events are already printed to console inside the function

        asyncio.run(main())
        
    except KeyboardInterrupt:
        print("\nTest cancelled by user.")
    except Exception:
        import traceback
        print(f"\n[ERROR] An error occurred while running the agent:")
        traceback.print_exc()
    finally:
        print("\n[CLEANUP] Stopping MCP Servers...")
        mcp_process.terminate()
        misc_mcp_process.terminate()
        auditor_mcp_process.terminate()
        
        print(f"[CLEANUP] Downloading generated outputs to host...")
        os.makedirs("outputs", exist_ok=True)
        subprocess.run(["docker", "cp", f"{container_id}:/workspace/outputs/.", "outputs/"], capture_output=True)
        
        print(f"[CLEANUP] Killing Ephemeral Docker Container {container_id[:12]}...")
        subprocess.run(["docker", "rm", "-f", container_id], capture_output=True)
        print("Done!")

if __name__ == "__main__":
    run_test()
