import asyncio
import subprocess
import os
import sys
import uuid
import time

def start_docker_sandbox():
    """Starts an ephemeral docker container mapping data.csv and returns its ID."""
    image = "sandbox-python:latest"
    container_name = f"lustitia-sandbox-{uuid.uuid4().hex[:8]}"
    print(f"[DOCKER] Starting ephemeral container {container_name} from {image}...")
    
    # Ensure local outputs directory exists
    os.makedirs("outputs", exist_ok=True)
    data_path = os.path.abspath("dataset/data.csv")
    
    try:
        result = subprocess.run([
            "docker", "run", "-d", "--name", container_name,
            "-v", f"{data_path}:/workspace/data.csv",
            "--network", "bridge", image, "tail", "-f", "/dev/null"
        ], capture_output=True, text=True, check=True)
        container_id = result.stdout.strip()
        print(f"[DOCKER] Container started successfully. ID: {container_id[:12]}")
        return container_id
    except subprocess.CalledProcessError as e:
        print(f"[DOCKER] Failed to start. Is Docker running? Error: {e.stderr}")
        sys.exit(1)

def run_test():
    container_id = start_docker_sandbox()
    
    print("[MCP] Starting Sandbox MCP Server on port 8000...")
    mcp_process = subprocess.Popen(
        [sys.executable, os.path.join("mcps", "sandbox", "mcp_server.py")],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    time.sleep(3)
    
    try:
        sys.path.append(os.path.abspath("agents"))
        from agents.graph import run_langgraph_agent
        asyncio.run(run_langgraph_agent(container_id))
    except KeyboardInterrupt:
        print("\nTest cancelled by user.")
    except Exception:
        import traceback
        print(f"\n[ERROR] An error occurred while running the agent:")
        traceback.print_exc()
    finally:
        print("\n[CLEANUP] Stopping MCP Server...")
        mcp_process.terminate()
        mcp_process.wait()
        
        print(f"[CLEANUP] Downloading generated graphs/outputs to host...")
        os.makedirs("outputs", exist_ok=True)
        subprocess.run(["docker", "cp", f"{container_id}:/workspace/outputs/.", "outputs/"], capture_output=True)
        
        print(f"[CLEANUP] Killing Ephemeral Docker Container {container_id[:12]}...")
        subprocess.run(["docker", "rm", "-f", container_id], capture_output=True)
        print("Done!")

if __name__ == "__main__":
    run_test()
