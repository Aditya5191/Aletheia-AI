import os
import shutil
from Lustitia.Sandbox_MCP.sandbox import SandboxManager

def test():
    container_id = "smoke-test-container"
    manager = SandboxManager()
    
    # Ensure local directory is clean
    local_dir = os.path.join(os.getcwd(), 'lmstudio_graphs')
    if os.path.exists(local_dir):
        shutil.rmtree(local_dir)
        
    print(f"Calling show_graphs for container {container_id}...")
    # Based on standard MCP Sandbox patterns, calling show_graphs
    manager.show_graphs(container_id)
    
    # Verify file
    result_path = os.path.join(local_dir, 'smoke_plot.png')
    if os.path.exists(result_path):
        print("PASS: smoke_plot.png found in lmstudio_graphs")
    else:
        print(f"FAIL: smoke_plot.png NOT found in {local_dir}")
        if os.path.exists(local_dir):
             print(f"Directory contents: {os.listdir(local_dir)}")
        else:
             print("Directory does not exist")

if __name__ == '__main__':
    test()
