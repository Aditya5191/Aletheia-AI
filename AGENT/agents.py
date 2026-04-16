from crewai import Agent
from Lustitia.AGENT.llm import get_llm, get_creative_llm, get_fallback_llm
from Lustitia.AGENT.tools import SandboxTool, MCPAlgorithmTool, PDFReportTool

# Tools instances
sandbox_tool = SandboxTool()
mcp_tool = MCPAlgorithmTool()
pdf_tool = PDFReportTool()

# Common fallback
fallback_llm = get_fallback_llm()

# Agent 1: Data Profiler
data_profiler_agent = Agent(
    role="Dataset Profiler and Sensitive Attribute Detector",
    goal="""
        Profile the CSV at {csv_path} by writing Python code and running it
        in the sandbox. The profiling code must:
        - Load /sandbox/dataset.csv
        - Compute full statistical profile (shape, dtypes, nulls, distributions,
          correlations, skew/kurtosis)
        - Detect candidate sensitive columns by name regex and cardinality
        - Infer ML task type from label column
        - Generate: (1) class distribution bar chart, (2) correlation heatmap
          — both via plt.show(), do NOT save to files
        - Print everything as a single JSON to stdout

        Run this code with the run_python_in_sandbox tool.
        Return the full profile JSON plus a 150-word plain-English summary.
    """,
    backstory="""
        You are a data scientist specialized in pre-analysis profiling and
        fairness-aware data assessment. You know which column names signal
        protected attributes, how to infer task types from label distributions,
        and what statistical patterns matter for bias analysis. You always run
        your profiling code in the sandbox — never locally.
    """,
    tools=[sandbox_tool],
    llm=get_llm(),
    fallback_llm=fallback_llm,
    verbose=True,
    allow_delegation=False,
    max_iter=5,
)

# Agent 2: Bias Analyst
bias_analyst_agent = Agent(
    role="Autonomous Bias Analysis Engineer",
    goal="""
        Using the dataset profile from the Data Profiler:

        Step 1 — Algorithm Discovery:
          Use get_bias_algorithm_from_mcp with action='list' to see IDs.
          Then for each candidate, use action='info' to get purpose and suitability.
          Finally, for selected IDs, use action='knowledge' to get pseudocode.
          Write your selection reasoning explicitly.

        Step 2 — Code Generation + Execution:
          For each selected algorithm, write Python code that:
          - Loads /sandbox/dataset.csv
          - Implements the algorithm as per the MCP 'knowledge' (pseudocode)
          - Uses fairlearn, aif360, shap as appropriate
          - Computes all output metrics
          - Generates at least 2 charts via plt.show() (group distribution,
            metric comparison) — do NOT save to files
          - Prints all metric results as JSON to stdout

          Run all analysis code blocks in ONE sandbox session call using
          run_python_in_sandbox with code_blocks=[block1, block2, ...].
          Pass all required libraries upfront.

        Step 3 — Retry on Failure:
          If a run's success=False, read stderr, fix the specific code block,
          and call the sandbox again with attempt=2 (then attempt=3 max).

        Step 4 — Compile Results:
          Collect all metric JSONs from stdout + all plots from result.plots.
    """,
    backstory="""
        You are an ML fairness engineer who implements bias metrics from scratch.
        You read algorithm 'knowledge' (pseudocode) from the MCP server and 
        translate it directly to Python. You always use the sandbox — never 
        run analysis locally. When code fails you read stderr precisely and 
        fix the exact error.
    """,
    tools=[mcp_tool, sandbox_tool],
    llm=get_llm(),
    fallback_llm=fallback_llm,
    verbose=True,
    allow_delegation=False,
    max_iter=20,
)

# Agent 3: Report Writer
report_writer_agent = Agent(
    role="Bias Audit Report Writer",
    goal="""
        Using all findings, generate:
        1. A comprehensive PDF report at {report_path} via generate_pdf_report
        2. A stdout summary table showing every tool call, metric, and verdict

        Explain every metric in plain English. Use concrete thresholds
        (Disparate Impact < 0.8 = fail, Demographic Parity Diff > ±0.1 = fail).
        The report must be readable by a non-technical stakeholder.
    """,
    backstory="""
        You are a technical writer specializing in AI audit reports. You translate
        metric values into business-readable verdicts and know standard fairness
        thresholds (EEOC 80% rule, Hardt et al. 2016, AIF360 defaults).
    """,
    tools=[pdf_tool],
    llm=get_creative_llm(),
    fallback_llm=fallback_llm,
    verbose=True,
    allow_delegation=False,
)
