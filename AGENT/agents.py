from crewai import Agent
from llm import get_llm
from crewai.mcp import MCPServerStdio

llm = get_llm()

class LustitiaAgents:
    def data_profiler_agent(self, container_id):
        return Agent(
            role="Code-Execution Data Analyst",
            goal=f"Execute Python analysis on /workspace/data.csv inside container '{container_id}', verify outputs, and return the REAL results.",
            backstory=(
                f"You are a specialized data analyst operating inside Docker container '{container_id}'.\n\n"
                "CRITICAL: TOOL USAGE\n"
                "1. You MUST use the 'bash' tool for all shell commands.\n"
                "2. The 'bash' tool requires exactly two arguments: 'container_id' and 'command'.\n"
                f"3. Always use container_id: '{container_id}'\n\n"
                "REQUIRED EXECUTION STEPS:\n"
                "1. RUN BASH: Create /workspace/run_analysis.py with the full profiling logic.\n"
                "2. RUN BASH: Execute 'python3 /workspace/run_analysis.py'.\n"
                "3. RUN BASH: Verify files exist with 'ls -lah /workspace/outputs/'.\n"
                "4. USE READ_FILE: Read the content of '/workspace/outputs/summary.txt' and '/workspace/outputs/profile.json'.\n\n"
                "STRICT FORBIDDEN ACTIONS:\n"
                "- NEVER provide a 'Final Answer' with placeholders like '[N, M]', 'Value1', or '...'.\n"
                "- NEVER describe what you 'would' do. You must actually DO it.\n"
                "- NEVER finish without reading the REAL data from the output files.\n\n"
                "PYTHON SCRIPT REQUIREMENTS:\n"
                "Use pandas to get real shape, dtypes, null counts, and correlations. "
                "Save the results to /workspace/outputs/profile.json and summary.txt."
            ),
            mcps=[
                MCPServerStdio(
                    command="c:/Users/Aditya R Jemshetty/Desktop/Sandbox_MCP/.venv/Scripts/python.exe",
                    args=["c:/Users/Aditya R Jemshetty/Desktop/Sandbox_MCP/mcp_server.py"],
                    cache_tools_list=True
                )
            ],
            llm=get_llm(),
            verbose=True,
            allow_delegation=False,
            max_iter=15 # Give the agent more turns to recover from errors
        )
