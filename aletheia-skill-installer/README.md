# create-aletheia-skill

An interactive installer for the Aletheia Fairness Auditor plugin. Aletheia is a multi-agent algorithmic fairness auditing framework that profiles datasets, detects bias using 13 statistical and causal algorithms, applies bias mitigations, and compiles structured audit reports — all executed in a secure, sandboxed environment.

This installer packages and delivers the plugin in the correct format for four AI coding environments: Antigravity, Claude Code, Codex (OpenAI), and IBM Bob. The same underlying MCP servers are also available as a manually-configured plugin for **watsonx Orchestrate** — see [Additional Platforms](#additional-platforms-manual-setup) below.
---

## Requirements

- Node.js 18 or later
- npm 9 or later
- For the sandbox execution environment: Docker Desktop installed and running

---

## Installation

Run the installer without installing it globally. npm will download the latest version automatically:

```bash
npx create-aletheia-skill
```

The installer is interactive. It will ask you two questions:

1. Which AI assistant you are installing for
2. Where to install or save the plugin output

---

## Supported Platforms

### Antigravity

The installer copies the plugin directly into the Antigravity plugins directory:

```
~/.gemini/config/plugins/aletheia-fairness-auditor/
```

After installation, restart Antigravity. The `aletheia-fairness-auditor` skill will be available in every session automatically. No further configuration is required.

If you prefer not to install directly, the installer offers a fallback that saves a `.zip` archive to your Desktop. Extract the archive manually into the directory above and restart.

**Plugin structure installed:**

```
aletheia-fairness-auditor/
├── plugin.json
├── skills/
│   └── aletheia-fairness-auditor/
│       ├── SKILL.md
│       └── references/
│           ├── algorithms/          (13 algorithm implementation guides)
│           └── workflows/           (4 step-by-step workflow instructions)
└── mcps/
    └── sandbox/
        └── mcp_server.py           (Docker sandbox MCP server)
```

---

### Claude Code

The installer generates a `.zip` archive saved to your Desktop by default. The archive is structured to comply with the Claude Code plugin specification.

**To import:**

1. Open Claude Code
2. Go to **Settings** > **Plugins** > **Install from file**
3. Select the generated `.zip` file
4. Restart Claude Code

The plugin registers five skills under the `aletheia` namespace:

| Skill | Purpose |
|---|---|
| `aletheia:auditor` | Main entry point. Runs the full 4-step audit pipeline. |
| `aletheia:data-surveyor` | Profiles the dataset and identifies protected attributes. |
| `aletheia:fairness-adjudicator` | Selects a fairness algorithm and executes the bias audit. |
| `aletheia:mitigation-agent` | Applies bias mitigation and computes post-mitigation metrics. |
| `aletheia:report-compiler` | Compiles findings and charts into a final audit report. |

The plugin also registers a bundled sandbox MCP server. If the installer prompts for an extract path, provide the directory where you will extract the plugin so that the MCP path can be configured correctly with absolute references.

---

### Codex (OpenAI)

The installer copies the plugin into a `plugins/` folder in your current working directory and creates or updates `.agents/plugins/marketplace.json`.

After restarting Codex, open the **Plugins** panel. Your local marketplace will appear as a selectable source. Browse and install **Aletheia Fairness Auditor** from the list.

The marketplace file can be committed to your repository so that other team members can access the same plugin without running the installer individually.

---

### IBM Bob

The installer natively configures the plugin for IBM Bob, handling both global and project-level installations.

1. **Global Install:** Copies the skill to `~/.bob/skills/` and patches `~/.bob/settings/mcp.json`.
2. **Project Install:** Copies the skill to `./.bob/skills/` and creates a local `./.bob/mcp.json`.

The installer automatically merges the Aletheia Sandbox MCP into Bob's JSON configuration and sets up the strict execution rules. After installation, simply restart Bob and the `aletheia-fairness-auditor` skill will appear in your Skills tab!

---

## Additional Platforms (Manual Setup)

This platform reuses the exact same MCP servers as above, but isn't wired into
the `npx create-aletheia-skill` interactive installer — set it up by hand from its
plugin folder.

### watsonx Orchestrate

`plugins/watsonx_aletheia-fairness-plugin/` registers the **Auditor** MCP server
(`list_algorithms`, `load_algorithm_knowledge`) as a Remote MCP Toolkit in watsonx
Orchestrate, using the ADK CLI's `orchestrate toolkits import --kind mcp` command.
Orchestrate's Tool Catalog only accepts remote MCP servers, so the Auditor server needs
to be reachable at a public URL (the same one used for the production deployment of
`mcps/auditor/server.py`), not `localhost`. See
[`MCP_SETUP.md`](plugins/watsonx_aletheia-fairness-plugin/MCP_SETUP.md) for the full
walkthrough.

**Quick start:**
```bash
pip install ibm-watsonx-orchestrate
orchestrate env activate <your-environment>
cd plugins/watsonx_aletheia-fairness-plugin
AUDITOR_MCP_URL="https://your-deployed-host/sse" ./import_toolkit.sh
```
Then attach the imported `aletheia-auditor` toolkit to an agent from Orchestrate's
Agent Builder / Tool Catalog UI.

---

## Using the Skill

Once installed, invoke the skill by describing your task in natural language. The agent will activate the appropriate workflow automatically.

**Example prompts:**

- "Run a fairness audit on my dataset."
- "Check whether this model discriminates against protected groups."
- "Detect disparate impact in this CSV and suggest a mitigation."
- "Apply reweighing to balance selection rates across demographic groups."

The agent does not require you to specify algorithm names or technical parameters. It selects the appropriate algorithm from the bundled knowledge library based on the structure of your data.

---

## The Audit Pipeline

Every audit follows a four-stage process. Each stage is driven by a dedicated workflow document that the agent reads before proceeding. The agent does not generate mathematical formulas from memory; all implementation logic is read from the bundled reference files.

| Stage | Role | Description |
|---|---|---|
| 1 | Data Surveyor | Profiles the dataset: shape, types, missing values, class distribution, and identification of protected attributes. |
| 2 | Fairness Adjudicator | Selects the most appropriate fairness algorithm, loads its implementation guide, and measures bias metrics before mitigation. |
| 3 | Bias Mitigator | Applies the selected mitigation algorithm and recomputes all fairness metrics to quantify the effect. |
| 4 | Report Compiler | Assembles findings, statistical tables, and generated charts into a structured markdown audit report. |

---

## Supported Algorithms

The plugin bundles implementation guides for 13 fairness algorithms:

| Algorithm | Type |
|---|---|
| Disparate Impact Repair | Pre-processing |
| Equality of Opportunity | Post-processing |
| Fairness Feedback Reparation | In-processing |
| SHAP Proxy Detection | Proxy detection |
| Mutual Information Proxy Scanner | Proxy detection |
| Brownian Distance Covariance | Dependency measurement |
| Causal Fair Inference | Causal reasoning |
| Causal Explanation Formula | Causal reasoning |
| Counterfactual Orthogonalization | Counterfactual |
| Intersectional Subgroup Scan | Subgroup analysis |
| Recidivism Fairness Calibration | Calibration |
| Distributionally Robust Optimization | Robust optimization |
| Relational Fairness (PSL) | Relational learning |

The agent selects the algorithm most suitable for your data's structure. You may also specify one directly in your prompt.

---

## Execution Environment

All Python code is executed in a Docker-based sandbox. This isolates audit computations from the host environment and ensures reproducibility across machines.

**Prerequisites for sandbox execution:**

1. Docker Desktop must be installed and running before starting an audit.
2. The sandbox MCP server starts automatically when the agent begins.

If Docker is unavailable, the agent will fall back to native Python execution in the host environment using whatever Python runtime is present. In this mode, chart outputs are saved as `.png` files rather than being rendered interactively.

---

## Project Structure

```
aletheia-skill-installer/
├── bin/
│   └── index.js                          # Interactive installer entry point
├── plugins/
│   ├── antigravity_aletheia-fairness-plugin/   # Antigravity plugin (installer-managed)
│   ├── claude_aletheia-fairness-plugin/         # Claude Code plugin (installer-managed)
│   ├── codex_aletheia-fairness-plugin/          # Codex plugin (installer-managed)
│   ├── bob_aletheia-fairness-plugin/            # IBM Bob plugin (manual setup)
│   └── watsonx_aletheia-fairness-plugin/        # watsonx Orchestrate toolkit (manual setup)
├── .npmignore
└── package.json
```

---

## License

ISC
