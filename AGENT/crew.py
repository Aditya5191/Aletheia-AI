import os
import argparse
import json
import datetime
from crewai import Crew, Process
from Lustitia.AGENT.agents import data_profiler_agent, bias_analyst_agent, report_writer_agent
from Lustitia.AGENT.tasks import profile_task, analysis_task, report_task

class ProcessLogger:
    def __init__(self):
        self.entries = []

    def log_step(self, step):
        """Callback for each step in the Crew execution."""
        # Note: step is a TaskResponce or similar depending on CrewAI version.
        # In 1.14.x, step_callback receives the AgentAction or TaskOutput.
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # This is a simplified logger as the exact structure of 'step' can vary
        entry = {
            "timestamp": timestamp,
            "agent": "Agent", # Can be extracted from step if available
            "data": str(step)
        }
        self.entries.append(entry)
        print(f"[{timestamp}] Step completed.")

    def as_text(self) -> str:
        """Formatted string for PDF + stdout."""
        log_text = "CHRONOLOGICAL PROCESS LOG\n"
        log_text += "=" * 30 + "\n"
        for entry in self.entries:
            log_text += f"[{entry['timestamp']}] {entry['data']}\n"
            log_text += "-" * 20 + "\n"
        return log_text

def main():
    parser = argparse.ArgumentParser(description="Lustitia Agentic Bias Detector")
    parser.add_argument("--csv", required=True, help="Path to the CSV file")
    parser.add_argument("--report", help="Optional path for the PDF report")
    
    args = parser.parse_args()
    
    csv_path = os.path.abspath(args.csv).replace('\\', '/')
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return

    csv_filename = os.path.basename(csv_path)
    csv_stem = os.path.splitext(csv_filename)[0]
    
    report_path = args.report or os.path.join(os.getcwd(), "reports", f"{csv_stem}_bias_report.pdf")
    os.makedirs(os.path.dirname(report_path), exist_ok=True)

    process_logger = ProcessLogger()

    # Define the Crew
    lustitia_crew = Crew(
        agents=[data_profiler_agent, bias_analyst_agent, report_writer_agent],
        tasks=[profile_task, analysis_task, report_task],
        process=Process.sequential,
        verbose=True,
        step_callback=process_logger.log_step,
    )

    print(f"Starting Bias Audit for: {csv_filename}")
    print(f"Report will be saved to: {report_path}")
    
    # Kickoff the process
    result = lustitia_crew.kickoff(inputs={
        "csv_path": csv_path,
        "report_path": report_path
    })

    print("\n" + "="*50)
    print("FINAL PROCESS LOG SUMMARY")
    print("="*50)
    print(process_logger.as_text())
    print("="*50)
    print("\nAudit Result:")
    print(result)

if __name__ == "__main__":
    main()
