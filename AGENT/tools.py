import os
import json
import base64
import io
import asyncio
import concurrent.futures
import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from crewai.tools import BaseTool
from llm_sandbox import ArtifactSandboxSession
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.units import inch

class SandboxToolInput(BaseModel):
    csv_path: str = Field(..., description="Local path to the CSV file.")
    code_blocks: List[str] = Field(..., description="List of Python scripts to run in sequence.")
    libraries: List[str] = Field(..., description="Pip packages to install before the first run.")
    attempt: int = Field(1, description="Retry attempt number (1-3).")

class SandboxTool(BaseTool):
    name: str = "run_python_in_sandbox"
    description: str = (
        "Execute Python code securely inside a Docker container using llm-sandbox. "
        "IMPORTANT: You MUST provide the csv_path as a valid string. "
        "The CSV is uploaded to /sandbox/dataset.csv. Always use /sandbox/dataset.csv "
        "in your python code. Results MUST be printed to stdout as a single JSON object. "
        "Keep your Python code as a simple string within the code_blocks list. "
        "Avoid complex triple-escaping of quotes if possible."
    )
    args_schema: type[BaseModel] = SandboxToolInput

    def _run(self, csv_path: str, code_blocks: List[str], libraries: List[str], attempt: int = 1) -> str:
        image = os.getenv("SANDBOX_IMAGE", "ghcr.io/vndee/sandbox-python-311-bullseye")
        runs = []
        plot_index = 0

        try:
            with ArtifactSandboxSession(lang="python", image=image, verbose=False) as session:
                # Upload CSV once
                session.copy_to_runtime(csv_path, "/sandbox/dataset.csv")

                for i, code in enumerate(code_blocks):
                    result = session.run(
                        code=code,
                        libraries=libraries if i == 0 else None,
                        timeout=300,
                        clear_plots=True,
                    )
                    plots = []
                    for plot in result.plots:
                        plots.append({
                            "index": plot_index,
                            "data_b64": plot.content_base64
                        })
                        plot_index += 1

                    runs.append({
                        "index": i,
                        "success": result.exit_code == 0,
                        "stdout": result.stdout,
                        "stderr": result.stderr,
                        "plots": plots,
                    })

                    if result.exit_code != 0:
                        break

            return json.dumps({
                "runs": runs,
                "total_plots": plot_index,
                "attempt": attempt
            })
        except Exception as e:
            return json.dumps({"error": str(e), "success": False})

class MCPAlgorithmToolInput(BaseModel):
    action: str = Field(..., description="'list', 'info', or 'knowledge'")
    algorithm_id: Optional[str] = Field(None, description="Identifier of the algorithm (e.g., 'algo1', 'algo2')")

class MCPAlgorithmTool(BaseTool):
    name: str = "get_bias_algorithm_from_mcp"
    description: str = (
        "Query the Lustitia MCP server. "
        "action='list' returns available IDs. "
        "action='info' returns metadata (purpose, suitability). "
        "action='knowledge' returns the implementation logic/pseudocode."
    )
    args_schema: type[BaseModel] = MCPAlgorithmToolInput

    def _run(self, action: str, algorithm_id: Optional[str] = None) -> str:
        mcp_url = os.getenv("MCP_SERVER_URL")
        if not mcp_url:
            return self._get_fallback(action, algorithm_id)

        from mcp import ClientSession
        from mcp.client.sse import sse_client

        async def query_mcp():
            try:
                async with sse_client(mcp_url) as streams:
                    async with ClientSession(streams[0], streams[1]) as session:
                        await session.initialize()
                        
                        if action == "list":
                            # server.py doesn't have a list tool, but we know the IDs
                            return json.dumps({
                                "algorithms": ["algo1", "algo2", "algo3", "algo4", "algo5", "algo6", "algo7", "algo9", "algo10", "algo11"]
                            })
                        
                        elif action == "info":
                            result = await session.call_tool("get_algorithm_info", {"algorithm_id": algorithm_id or "algo1"})
                            return result.content[0].text if result.content else "{}"
                        
                        elif action == "knowledge":
                            result = await session.call_tool("load_algorithm_knowledge", {"algorithm_id": algorithm_id})
                            return result.content[0].text if result.content else "No knowledge found."
                            
            except Exception as e:
                print(f"MCP Connection Error: {str(e)}")
                return self._get_fallback(action, algorithm_id)

        try:
            try:
                loop = asyncio.get_running_loop()
                if loop.is_running():
                    import nest_asyncio
                    nest_asyncio.apply()
            except RuntimeError:
                pass
            
            return asyncio.run(query_mcp())
        except Exception:
            return self._get_fallback(action, algorithm_id)

    def _get_fallback(self, action: str, algorithm_id: Optional[str] = None) -> str:
        if action == "list":
            return json.dumps({"algorithms": ["algo1", "algo2", "algo3"], "_fallback": True})
        
        fallbacks = {
            "algo1": {"name": "Disparate Impact Remover", "purpose": "Pre-processing removal of bias"},
            "algo2": {"name": "Equalized Odds", "purpose": "Post-processing threshold optimization"},
            "algo3": {"name": "Predictive Parity Calibration", "purpose": "Tradeoff analysis"}
        }
        
        if action == "info":
            return json.dumps(fallbacks.get(algorithm_id, {"error": "Algorithm not found"}))
        elif action == "knowledge":
            return "Fallback knowledge: Implement using standard group-wise metrics."
        return json.dumps({"error": "Invalid action"})

class PDFReportToolInput(BaseModel):
    output_path: str = Field(..., description="Path to save the PDF report.")
    dataset_name: str = Field(..., description="Name of the dataset.")
    profile_json: str = Field(..., description="JSON string from profiling run.")
    algo_reasoning: str = Field(..., description="Explanation of algorithm choices.")
    findings_json: str = Field(..., description="JSON string of metric results.")
    charts_b64: List[str] = Field(..., description="List of base64 PNG strings.")
    process_log: str = Field(..., description="Full chronological log of tool calls.")
    recommendations: str = Field(..., description="Plain-English recommendations.")

class PDFReportTool(BaseTool):
    name: str = "generate_pdf_report"
    description: str = "Assemble and save a full PDF bias audit report using reportlab."
    args_schema: type[BaseModel] = PDFReportToolInput

    def _run(self, output_path: str, dataset_name: str, profile_json: str, algo_reasoning: str,
             findings_json: str, charts_b64: List[str], process_log: str, recommendations: str) -> str:
        try:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            doc = SimpleDocTemplate(output_path, pagesize=letter)
            styles = getSampleStyleSheet()
            elements = []

            # Cover Page
            elements.append(Paragraph("Bias Audit Report", styles['Title']))
            elements.append(Spacer(1, 0.5 * inch))
            elements.append(Paragraph(f"Dataset: {dataset_name}", styles['Heading2']))
            elements.append(Paragraph(f"Date: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            
            # Simple verdict badge detection logic
            findings = json.loads(findings_json)
            any_fail = False
            for algo, metrics in findings.items():
                if isinstance(metrics, dict) and metrics.get('status') == 'FAIL':
                    any_fail = True
                    break
            
            verdict = "⛔ BIASED" if any_fail else "✅ CLEAN"
            elements.append(Spacer(1, 1 * inch))
            elements.append(Paragraph(f"Verdict: {verdict}", styles['Heading1']))
            elements.append(Paragraph("Generated by: Lustitia Agentic Bias Detector", styles['Italic']))
            elements.append(PageBreak())

            # Executive Summary
            elements.append(Paragraph("Executive Summary", styles['Heading1']))
            summary = "The analysis detected potential biases in the dataset based on the selected algorithms." if any_fail else "No significant biases were detected."
            elements.append(Paragraph(summary, styles['Normal']))
            elements.append(Spacer(1, 0.2 * inch))
            elements.append(PageBreak())

            # Dataset Overview
            elements.append(Paragraph("Dataset Overview", styles['Heading1']))
            profile = json.loads(profile_json)
            data_table = [["Property", "Value"]]
            for k, v in profile.items():
                if isinstance(v, (str, int, float, bool)):
                    data_table.append([k, str(v)])
            t = Table(data_table)
            t.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), colors.grey), ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke)]))
            elements.append(t)
            elements.append(PageBreak())

            # Charts
            elements.append(Paragraph("Visualizations", styles['Heading1']))
            for b64 in charts_b64:
                try:
                    img_data = base64.b64decode(b64)
                    img = Image(io.BytesIO(img_data))
                    # Adjust image size to fit page
                    img.drawHeight = 3 * inch
                    img.drawWidth = 5 * inch
                    elements.append(img)
                    elements.append(Spacer(1, 0.2 * inch))
                except:
                    continue
            elements.append(PageBreak())

            # Findings
            elements.append(Paragraph("Findings", styles['Heading1']))
            findings_para = Paragraph(findings_json, styles['Code'])
            elements.append(findings_para)
            elements.append(Spacer(1, 0.2 * inch))
            elements.append(PageBreak())

            # Recommendations
            elements.append(Paragraph("Recommendations", styles['Heading1']))
            elements.append(Paragraph(recommendations, styles['Normal']))
            elements.append(PageBreak())

            # Process Log
            elements.append(Paragraph("Appendix: Process Log", styles['Heading1']))
            elements.append(Paragraph(process_log, styles['Code']))

            doc.build(elements)
            return f"PDF saved to {output_path}"
        except Exception as e:
            return f"ERROR: {str(e)}"
