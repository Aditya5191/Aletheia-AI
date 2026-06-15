<div align="center">

<img src="https://img.shields.io/badge/ALETHEIA-Privacy%20%26%20Security-2ecc71?style=for-the-badge&logoColor=white"/>

# 🔒 Privacy & Sandbox Architecture

[![Zero Data Retention](https://img.shields.io/badge/Data%20Retention-ZERO-2ecc71?style=flat-square)](.)
[![Docker Isolated](https://img.shields.io/badge/Execution-Docker%20Isolated-2496ED?style=flat-square&logo=docker)](.)
[![GDPR Compatible](https://img.shields.io/badge/Architecture-GDPR%20Compatible-4285F4?style=flat-square)](.)
[![Self-Host Available](https://img.shields.io/badge/Self--Host-Available-FF6B35?style=flat-square)](.)

**Your data never reaches us. By architecture, not by policy.**

← [Back to Main README](../README.md)

</div>

---

## The Core Guarantee

When you run an Aletheia audit, **your data — your dataset, your model file, your sample CSV — never leaves your own infrastructure.** This is not a privacy policy statement. It is a technical fact enforced by the architecture.

---

## The Five Privacy Guarantees

### 1. Your Files Are Copied Into Docker, Not Sent Anywhere

When you upload a file through the Aletheia web interface, it is received by the FastAPI backend running on **your server or your cloud VM**. It is then copied directly into a Docker container on that same machine using `docker cp`. The file never traverses the public internet to reach any Aletheia-controlled server.
<img width="500" height="500" alt="image" src="https://github.com/user-attachments/assets/ab57a929-45ff-47f1-9dff-dc1f240d1b59" />



### 2. All Four Agents Run Inside the Container

The entire 4-agent pipeline — Data Surveyor, Fairness Adjudicator, Bias Mitigator, Report Compiler — executes Python code inside the container via a persistent Jupyter-style REPL (the `execute_cell` tool). Every computation, every chart, every analysis happens inside `/workspace/` in the container. Nothing is written to any external location during the audit.

```
Inside Docker /workspace/:
├── dataset.csv          ← your data, never leaves
├── model.pkl            ← your model, never leaves  
├── outputs/
│   ├── agent1.md
│   ├── agent2.md
│   ├── final_report.pdf
│   ├── fixed_dataset.csv
│   └── figures/
```

### 3. The MCP Server Receives Only Algorithm IDs

The agents do communicate with Aletheia's MCP (Model Context Protocol) servers during an audit. **But they only send algorithm identifiers**, not data.

```
What an agent sends to the MCP server:
  load_algorithm_knowledge("equality_of_opportunity")

What the MCP server returns:
  A mathematical specification document

What the MCP server NEVER receives:
  ❌ Your dataset
  ❌ Your model file
  ❌ Any row of your data
  ❌ Any column name or value
  ❌ Any prediction or output
```

The MCP servers are knowledge delivery systems — they function like a textbook. The agent asks for a chapter, the server returns it. Your data is not involved.

### 4. The Container Is Destroyed After Every Audit

After the pipeline completes, the backend copies output files out of the container and then removes it entirely:

When `docker rm -f` completes, every byte of your original data inside that container is gone. There is no persistent storage, no log that contains your data, no cache.

### 5. Stale Containers Are Cleaned on Startup

Every time the backend restarts, it runs a cleanup function that removes any containers that might have been left over from a previous crashed session:

No orphaned containers. No leftover data.

---

## What the Aletheia Team Can See

| Item | Can Aletheia See It? |
|------|---------------------|
| Your dataset rows | ❌ No |
| Your model weights | ❌ No |
| Your column names | ❌ No |
| Your predictions | ❌ No |
| Your audit report contents | ❌ No |
| Which algorithm was selected | ❌ No |
| That an audit ran (server logs) | ✅ Yes — timestamp and container ID only |
| Vertex AI / Gemini API calls | ✅ Yes — agent prompts (no user data in prompts) |

**The agent prompts contain your audit configuration but never your actual data.** The system prompts tell agents what their job is. They do not contain CSV rows.

---

## Using Aletheia as a Local Plugin

When you use Aletheia as a Claude Code skill, Gemini CLI plugin, or any other coding agent plugin, the privacy guarantee is **stronger** — nothing leaves your machine at all.

```
npx create-aletheia-skill@latest
```

After installation, the entire pipeline — agents, MCP servers, Docker sandbox — runs locally. The only external call is to Vertex AI / the LLM API for agent reasoning. Your data never leaves your machine.

```
Local Plugin Mode:
  Your Files → Local Docker → Local Agents → Local MCP
                    ↓
            LLM API (reasoning only, no data)
                    ↓
            Output Files → Your Directory
```

---

## Self-Hosting for Complete Air-Gap

For organisations that require **zero external network calls**, Aletheia can be fully self-hosted including the MCP servers and with a locally-hosted LLM.

### What to Self-Host

```bash
# 1. Clone the repository
git clone https://github.com/Aditya5191/Aletheia-AI
cd Aletheia-AI

# 2. Build the sandbox Docker image
docker build -t sandbox-python:latest ./mcps/sandbox/

# 3. Run the MCP servers locally
python mcps/sandbox/mcp_server.py --port 8000 &
python mcps/auditor/server.py --port 8001 &
python mcps/miscellaneous/server.py --port 8002 &

# 4. Configure to use a local LLM instead of Vertex AI
# Edit backend/*/agents/*_graph.py:
# Replace ChatVertexAI with ChatOllama or any local LLM adapter
```

### What Self-Hosting Achieves

```
Full Air-Gap Mode:
  Your Files → Your Docker → Your Agents
       ↓              ↓            ↓
  Never leaves   Never leaves  Local LLM only
  your machine   your machine  No external calls
```

---

## For Plugin Users — How Privacy Works

When you install and use the Aletheia plugin in Claude Code or any coding agent:

**The plugin connects Claude to the Aletheia MCP server for algorithm knowledge only.** The MCP server receives algorithm IDs. Your dataset and model files are processed locally inside Docker and are never transmitted anywhere.

The conversation you have with Claude about your audit is subject to Anthropic's (or whichever LLM provider's) privacy policies, as with any Claude conversation. However, the actual data file contents are not sent to Claude — Claude only sees the audit findings and metrics after they have been computed locally.

---

<div align="center">

← [Back to Main README](../README.md) · [Plugin Guide →](PLUGINS.md) · [Algorithm Reference →](ALGORITHMS.md)

</div>
