from crewai import Task
from agents import data_profiler_agent, bias_analyst_agent, report_writer_agent

# Task 1: Profile Dataset
profile_task = Task(
    description="""
        Write Python code that does all of the following — then run it with
        run_python_in_sandbox.

        The code must:
          import pandas as pd, numpy as np, matplotlib.pyplot as plt,
                 seaborn as sns, json

          df = pd.read_csv("/sandbox/dataset.csv")

          # 1. Compute all stats (shape, dtypes, nulls, value_counts, corr, skew)
          # 2. Detect sensitive cols via regex on column names + cardinality check
          # 3. Detect label col: binary/low-cardinality cols
          # 4. Infer task type
          # 5. Generate class distribution bar chart → plt.show()
          # 6. Generate correlation heatmap → plt.show()
          # 7. Build a results dict and print(json.dumps(results))

        Pass libraries=["pandas","numpy","matplotlib","seaborn"] to the tool.

        Return:
        - The full JSON from stdout
        - A 150-word plain-English summary of the dataset
        - The base64 chart data from result.plots (for the report)
    """,
    expected_output="""
        Full profiling JSON (shape, columns, stats, sensitive_cols, label_col,
        task_type, warnings) followed by a plain-English summary. Also include
        the base64 chart strings from result.plots so the Report Writer can
        embed them.
    """,
    agent=data_profiler_agent,
)

# Task 2: Algorithm Selection + Bias Analysis
analysis_task = Task(
    description="""
        Using the dataset profile from Task 1:

        Step 1 — Query MCP:
          list all algorithms, then get details on the 3–5 most promising ones.
          Write down: why you chose each selected algorithm, why you skipped others.

        Step 2 — Write analysis code for each selected algorithm:
          Each code block must:
            - Load /sandbox/dataset.csv
            - Use the sensitive_col and label_col from the profile
            - Implement the algorithm per MCP pseudocode
            - Install-free — all libs provided upfront
            - Compute all metrics the algorithm produces
            - Generate: group distribution bar chart, metric comparison chart
              (both via plt.show() — NOT saved to files)
            - Print results as: print(json.dumps({{"algorithm": name, "metrics": {{...}}}}))

        Step 3 — Execute:
          Call run_python_in_sandbox with:
            csv_path: {csv_path}
            code_blocks: [block_for_algo1, block_for_algo2, ...]
            libraries: ["pandas","numpy","matplotlib","seaborn",
                        "fairlearn","aif360","shap","scikit-learn"]

        Step 4 — Retry if needed:
          For any run with success=False, fix the code and retry (max 3 attempts).

        Step 5 — Compile:
          Parse each run's stdout JSON. Collect all plots from result.plots.
    """,
    expected_output="""
        1. Algorithm selection reasoning
        2. Per-algorithm execution log (attempts, errors fixed)
        3. Per-algorithm metrics: {{ algo_name: {{ metric: value, ... }} }}
        4. All chart base64 strings from result.plots
        5. Preliminary bias verdict with reasoning
    """,
    agent=bias_analyst_agent,
    context=[profile_task],
)

# Task 3: Generate Report
report_task = Task(
    description="""
        Call generate_pdf_report with:
          output_path:     {report_path}
          dataset_name:    derived from csv filename
          profile_json:    full JSON from Task 1
          algo_reasoning:  algorithm selection reasoning from Task 2
          findings_json:   all metric results from Task 2 as JSON
          charts_b64:      ALL base64 chart strings from Task 1 AND Task 2
          process_log:     chronological log of every tool call across all tasks
                           Format per entry:
                           [timestamp] AGENT: <role>
                           Tool: <tool_name>
                           Input: <brief summary>
                           Output: <brief summary>
                           Decision: <what the agent decided based on this>
          recommendations: write 5–7 specific, actionable recommendations.
                           Be concrete: name the column, the metric, the gap,
                           and a specific mitigation strategy.

        Then print this exact stdout summary:

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FAIRSIGHT BIAS AUDIT COMPLETE
          Dataset: <n>  Rows: <n>  Sensitive: <cols>
          Verdict: ⛔ BIASED | ✅ CLEAN | ⚠️ INCONCLUSIVE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Algorithm          Metric         Value   Status
          ─────────────────────────────────────────────
          <rows>
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Tool calls made: <n>
          Report saved to: <path>
    """,
    expected_output="""
        Confirmation that PDF was saved, the full stdout summary table,
        and the absolute path to the report.
    """,
    agent=report_writer_agent,
    context=[profile_task, analysis_task],
)
