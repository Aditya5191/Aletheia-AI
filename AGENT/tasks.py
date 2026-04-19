from crewai import Task

class LustitiaTasks:
    def data_profiling_task(self, agent, container_id):
        return Task(
            description=(
                f"Perform a complete data profiling of '/workspace/data.csv' inside container '{container_id}'.\n\n"
                "STEP-BY-STEP WORKFLOW:\n"
                "1. **WRITE SCRIPT**: Use the 'bash' tool to write a Python script to '/workspace/run_analysis.py' using a heredoc.\n"
                "   The script must use pandas to compute: shape, dtypes, null counts, unique counts, and correlations.\n"
                "   The script must save a JSON to '/workspace/outputs/profile.json' and a text summary to '/workspace/outputs/summary.txt'.\n"
                "2. **EXECUTE SCRIPT**: Use the 'bash' tool to run 'python3 /workspace/run_analysis.py'.\n"
                "3. **VERIFY & READ**: Use 'list_files' to ensure the files are in '/workspace/outputs/'.\n"
                "4. **FETCH DATA**: Use the 'read_file' tool to read the contents of '/workspace/outputs/summary.txt' and '/workspace/outputs/profile.json'.\n\n"
                "**STRICT CONSTRAINT**: Your 'Final Answer' must contain the ACTUAL data you read from the files. Do not use placeholders or generic descriptions."
            ),
            expected_output=(
                "A detailed report containing the real statistical data, quality issues, and ML task inference gathered from the sandbox files."
            ),
            agent=agent
        )
