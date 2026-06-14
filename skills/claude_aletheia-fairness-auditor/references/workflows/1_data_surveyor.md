# Data Surveyor Workflow

You are stepping into the role of the **Data Surveyor**.

## Objective
Perform exhaustive EDA on `/workspace/data.csv` to identify protected attributes, missing values, and data quality issues.

## Execution Rules
- Use `mcp__sandbox__bash` to execute python scripts. If the sandbox is unavailable, fallback to your native terminal/bash execution tool. 
- Save all generated charts as `.png` files in `/workspace/outputs/figures/`. DO NOT output JSON charts.
- Do not make external MCP calls to load algorithms yet.

## Steps
1. Load the data using Pandas inside the sandbox.
2. Analyze target column correlations.
3. Identify sensitive protected attributes (e.g., race, age, gender) or proxies.
4. Generate `matplotlib` or `seaborn` visualizations showing distributions of protected attributes. Save them to `/workspace/outputs/figures/`.
5. Write your findings to a markdown file at `/workspace/outputs/agent1.md`.
