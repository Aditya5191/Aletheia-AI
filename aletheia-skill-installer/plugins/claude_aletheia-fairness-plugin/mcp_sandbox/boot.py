import os
import sys
import subprocess

DIR = os.path.dirname(os.path.abspath(__file__))
VENV_DIR = os.path.join(DIR, ".venv")
PYTHON_EXE = os.path.join(VENV_DIR, "Scripts", "python.exe") if os.name == 'nt' else os.path.join(VENV_DIR, "bin", "python")

def bootstrap():
    if not os.path.exists(VENV_DIR):
        print("Aletheia Sandbox: First run detected. Creating isolated Python environment...", file=sys.stderr)
        subprocess.check_call([sys.executable, "-m", "venv", VENV_DIR], stdout=sys.stderr)
        
        print("Aletheia Sandbox: Installing dependencies (mcp<2.0.0, docker)...", file=sys.stderr)
        subprocess.check_call([PYTHON_EXE, "-m", "pip", "install", "mcp<2.0.0", "docker"], stdout=sys.stderr)
        
        print("Aletheia Sandbox: Environment ready! Booting server...", file=sys.stderr)

    # Launch the actual MCP server, passing along any arguments and perfectly forwarding stdio
    p = subprocess.Popen([PYTHON_EXE, os.path.join(DIR, "mcp_server.py")] + sys.argv[1:])
    p.wait()
    sys.exit(p.returncode)

if __name__ == "__main__":
    bootstrap()
