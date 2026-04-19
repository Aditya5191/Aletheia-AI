import subprocess
import os
import time
import uuid
from crewai import Crew, Process
from agents import LustitiaAgents
from tasks import LustitiaTasks

class SandboxManager:
    """Manages the lifecycle of the Docker sandbox container."""
    def __init__(self, image="ghcr.io/vndee/sandbox-python-311-bullseye"):
        self.image = image
        self.container_id = None

    def create_container(self, local_csv_path):
        """Creates a container and mounts the local CSV to /workspace/data.csv."""
        abs_local_path = os.path.abspath(local_csv_path)
        if not os.path.exists(abs_local_path):
            raise FileNotFoundError(f"Dataset not found at {abs_local_path}")

        # Ensure the path uses forward slashes for Docker volume mounting on Windows
        abs_local_path = abs_local_path.replace("\\", "/")
        
        container_name = f"lustitia-sandbox-{uuid.uuid4().hex[:8]}"
        
        print(f"Starting Docker container from {self.image}...")
        
        try:
            # We ensure network access is available (default)
            # We mount the file to /workspace/data.csv
            run_command = [
                "docker", "run", "-d",
                "--name", container_name,
                "--network", "bridge", # Explicitly ensure bridge networking for internet access
                "-v", f"{abs_local_path}:/workspace/data.csv",
                self.image,
                "tail", "-f", "/dev/null"
            ]
            
            result = subprocess.run(run_command, capture_output=True, text=True, check=True)
            self.container_id = result.stdout.strip()
            
            # Create outputs directory inside the container
            subprocess.run(["docker", "exec", self.container_id, "mkdir", "-p", "/workspace/outputs"], check=True)
            
            print(f"Container started successfully. ID: {self.container_id}")
            return self.container_id
        except subprocess.CalledProcessError as e:
            print(f"Failed to start Docker container: {e.stderr}")
            raise

    def stop_container(self):
        """Stops and removes the container."""
        if self.container_id:
            print(f"Stopping and removing container {self.container_id}...")
            subprocess.run(["docker", "stop", self.container_id], capture_output=True)
            subprocess.run(["docker", "rm", self.container_id], capture_output=True)
            print("Cleanup complete.")

class LustitiaCrew:
    def __init__(self, container_id):
        self.container_id = container_id
        self.agents = LustitiaAgents()
        self.tasks = LustitiaTasks()

    def run(self):
        # Initialize the agent with the container_id
        profiler_agent = self.agents.data_profiler_agent(self.container_id)

        # Initialize the task
        profiling_task = self.tasks.data_profiling_task(profiler_agent, self.container_id)

        # Create and run the crew
        crew = Crew(
            agents=[profiler_agent],
            tasks=[profiling_task],
            process=Process.sequential,
            verbose=True
        )

        return crew.kickoff()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run Lustitia Data Profiling Crew")
    parser.add_argument("--csv", type=str, default="dataset/Law/compas-scores.csv", help="Path to the local CSV dataset")
    args = parser.parse_args()

    DATASET_PATH = args.csv
    
    sandbox = SandboxManager()
    container_id = None
    
    try:
        container_id = sandbox.create_container(DATASET_PATH)
        
        lustitia_crew = LustitiaCrew(container_id)
        result = lustitia_crew.run()
        
        print("\n\n########################")
        print("## Profiling Results ##")
        print("########################\n")
        print(result)
        
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if container_id:
            sandbox.stop_container()
