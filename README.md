<div align="center">

<img src="https://img.shields.io/badge/ALETHEIA-AI%20Fairness%20Auditing-ff6b35?style=for-the-badge&logoColor=white" alt="Aletheia"/>

# ALETHEIA AI
### Autonomous Algorithmic Fairness Auditing Protocol

[![Live MVP](https://img.shields.io/badge/🚀%20Live%20MVP-aletheia--frontend-4285F4?style=for-the-badge)](https://aletheia-frontend-69262873588.us-central1.run.app/)
[![Demo Video](https://img.shields.io/badge/▶%20Demo%20Video-YouTube-FF0000?style=for-the-badge&logo=youtube)](https://youtu.be/Xu2u8bvfD-w)
[![GitHub](https://img.shields.io/badge/GitHub-Aletheia--AI-181717?style=for-the-badge&logo=github)](https://github.com/Aditya5191/Aletheia-AI)
[![Google Solution Challenge](https://img.shields.io/badge/Google-Solution%20Challenge%202025-4285F4?style=for-the-badge&logo=google)](https://developers.google.com/community/gdsc-solution-challenge)

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-WebSocket-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF6B35?style=flat-square)](https://langchain-ai.github.io/langgraph/)
[![Vertex AI](https://img.shields.io/badge/Vertex%20AI-Gemini%20Pro-4285F4?style=flat-square&logo=google-cloud)](https://cloud.google.com/vertex-ai)
[![Docker](https://img.shields.io/badge/Docker-Sandboxed-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![MCP](https://img.shields.io/badge/MCP-Custom%20Protocol-BB9AF7?style=flat-square)](https://modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---
<img width="1612" height="853" alt="image" src="https://github.com/user-attachments/assets/3b93afa6-041b-461f-8707-ca752034d438" />


</div>

---

## Table of Contents

- [What is Aletheia?](#-what-is-aletheia)
- [Why India Needs This](#-why-india-needs-this)
- [How it Works](#-how-it-works)
- [Two Audit Modes](#-two-audit-modes)
- [The 13-Algorithm MCP Server](#-the-13-algorithm-mcp-server)
- [Architecture](#-architecture)
- [Key Differentiators](#-key-differentiators)
- [Plugin Support](#-plugin-support)
- [Privacy & Security](#-privacy--security)
- [Agent Breakdowns](#-agent-breakdowns)
- [Tech Stack](#-tech-stack)
- [Cost Estimate](#-cost-estimate)
- [Quick Start](#-quick-start)
- [Project Links](#-project-links)

---

##  What is Aletheia?

**Aletheia** is a production-ready, autonomous agentic pipeline that **detects, measures, fixes, and verifies bias** in any dataset or pretrained ML model — without requiring a data science team.

At its core is a **custom-built Audit Algorithm MCP Server** (Knowledge Skill Delivery model) that injects runnable algorithm knowledge into each agent's context at runtime. Rather than hardcoding any single fairness method, Aletheia's agents dynamically discover, reason through, and implement the most appropriate algorithm for the specific dataset structure, domain, and data availability they encounter.

```
Upload CSV or Model  →  4 Autonomous Agents  →  PDF Report + Fixed Output
       ↓                        ↓                         ↓
  No ML expertise          Docker isolated            Plain English
  No configuration         MCP-powered               + Technical metrics
  No code required         13 algorithms             + Drop-in fix
```

---

## 🇮🇳 Why India Needs This

India's AI ecosystem is deploying algorithms in high-stakes decisions affecting millions — **without any systematic fairness auditing.**

| Sector | Reality Today |
|--------|--------------|
| **HRtech** (Naukri, Unstop, HireQuotient) | AI screening tools learn caste and gender signals from historical hiring data |
| **Fintech** (Slice, KreditBee, MoneyView) | ML credit scoring uses postcodes and education as proxies for socioeconomic group |
| **HealthTech** | Diagnostic AI trained on urban hospital data performs significantly worse on rural patients |
| **EdTech** | Adaptive learning models calibrated on high-income student patterns disadvantage others |

India currently has **no AI fairness regulation** equivalent to the EU AI Act. The Digital Personal Data Protection Act 2023 covers privacy but not algorithmic bias. However, India's **Constitution already addresses this** — Articles 15 and 16 prohibit discrimination on grounds of religion, race, caste, sex, and place of birth. AI systems that replicate historical discrimination patterns conflict with these guarantees.

**Aletheia helps Indian companies get ahead of regulation before it arrives.**

---

##  How it Works

<img width="1920" height="1080" alt="Action step" src="https://github.com/user-attachments/assets/3c105ded-b105-4b1a-b0d3-6468738859b6" />


---

##  Two Audit Modes

### Mode 1 — Dataset Audit

Upload a CSV with demographic attributes and an outcome column. No model required.

**What you get:**
- Fixed dataset CSV with bias repaired
- Publication-ready PDF audit report
- Interactive **AI Chatbot** to query agent findings in plain English
- **Test Mode** for instant pipeline simulation
- Before/after fairness metric comparison
- All agent code (ipykernel) visible and downloadable

**Agents:** Data Surveyor → Fairness Adjudicator → Bias Mitigator → Report Compiler

→ **[Full Dataset Agent Breakdown](docs/DATASET_AGENTS.md)**

---

### Mode 2 — Model Audit

Upload a trained sklearn-compatible `.pkl` or `.joblib` model + a representative sample CSV.

**What you get:**
- `threshold_map.json` (classifiers) or `correction_map.json` (regressors) — drop-in fix
- Fixed predictions CSV
- SHAP attribution charts
- Interactive **AI Chatbot** customized to explain model thresholds and prediction disparities
- **Test Mode** for instant model auditing simulation
- Counterfactual discrimination evidence
- Publication-ready PDF audit report

**Agents:** Model Inspector/Profiler → Behavioral/Disparity Auditor → Threshold Calibrator/Output Recalibrator → Report Compiler

→ **[Full Model Agent Breakdown](docs/MODEL_AGENTS.md)**

---

## 🔬 The 13-Algorithm MCP Server

Aletheia's core differentiator is the **custom Audit Algorithm MCP Server** — a Knowledge Skill Delivery system that injects peer-reviewed fairness algorithm specifications into agent context at runtime.

Agents call `list_algorithms()` → `get_algorithm_info()` for each candidate → reason through an elimination log → `load_algorithm_knowledge()` for selected algorithms → implement from mathematical specification.

**No hardcoded choices. No library wrappers. Full auditability.**

→ **[Full MCP & Algorithm Reference](docs/ALGORITHMS.md)**

### Algorithm Categories at a Glance

| Category | Algorithms | Purpose |
|----------|-----------|---------|
|  **Detection** | Intersectional Scanner, Mutual Info Proxy, Distance Covariance, SHAP Proxy | Find hidden bias |
|  **Mitigation** | Disparate Impact Repair, Equal Opportunity, Recidivism Calibrator | Fix the bias |
|  **Causal** | Causal Fair Inference, Counterfactual Fairness, Causal Explanation | Understand why |
|  **Structural** | Fairness Feedback Reparation, DRO Without Demographics, Relational Fairness PSL | Specialist cases |

---

##  Architecture

### System Architecture

<img width="1672" height="941" alt="cloud-artiture" src="https://github.com/user-attachments/assets/c25e3ce3-93ad-40dc-b0f5-16e828c07243" />

### Three Pillars of the Architecture

**01 — Knowledge Skill Delivery Model**
The custom MCP Auditor server injects complete runnable algorithm knowledge into agent context at runtime. Any new algorithm can be added without touching agent code. Adapts implementation to each dataset's column structure from first principles. No external library dependencies — full auditability.

**02 — Custom Sandbox Environment**
LangGraph orchestrates specialist agents in a highly isolated Docker sandbox. Every decision a human fairness researcher would make — automated. All data isolated, never leaves the container. Full reproducible audit trail across all agents.

**03 — Dual-Audience Output Layer**
Plain-English verdict and before/after comparison for decision-makers. Full statistical metrics (DIR, SPD, EOD, FPRD), fixed CSV/model, and technical ZIP for ML teams. All agent code (ipykernel notebooks) available for user interpretability. Publication-ready PDF with charts and compliance tables.

---

##  Key Differentiators

| Capability | IBM AIF360 | Google What-If | Microsoft Fairlearn | Aequitas | Themis-ML | **Aletheia ✦** |
|-----------|:----------:|:--------------:|:-------------------:|:--------:|:---------:|:--------------:|
| Zero-code drag-and-drop | ❌ | Partial | ❌ | Partial | ❌ | **✅** |
| Auto algorithm selection | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ 13 algorithms** |
| Bias detection | Manual | Visual only | Manual | ✅ | Limited | **Full — proxy, intersectional, causal** |
| Automated bias mitigation | Some | ❌ | Some | ❌ | Some | **✅ Full before/after** |
| Proxy / indirect bias | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ SHAP, dCor, MI** |
| Intersectional analysis | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Causal fairness analysis | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ PSE, CEF** |
| Sandboxed execution | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ Docker isolated** |
| PDF audit report | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ Publication-ready** |
| Plain-English findings | ❌ | Partial | ❌ | Partial | ❌ | **✅ Full narrative** |
| Fixed dataset/model output | Manual | ❌ | Manual | ❌ | ❌ | **✅ Auto-generated** |
| Requires ML expertise | ✅ | ✅ | ✅ | Some | ✅ | **❌ No** |
| Multi-agent AI pipeline | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ LangGraph** |
| Plugin for coding agents | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ Claude, Codex, Gemini** |

**Four things no competitor does:**

1. **Closes the full loop** — detect → fix → document. Every competitor is either a library, a visualiser, or a point detector. None close the loop automatically.
2. **Dynamic algorithm selection via KSD** — 13 algorithms selected at runtime based on domain and data structure. No hardcoded wrappers.
3. **Four-agent LangGraph orchestration in Docker** — custom sandbox handler. No other fairness tool uses multi-agent AI orchestration.
4. **Zero-code — built for non-technical users** — equally usable by a founder and a data scientist.

---

## Plugin Support

Aletheia is packaged as a **plug-and-play plugin** for all major AI coding agents.

→ **[Full Plugin Integration Guide](Plugins.md)**

```bash
npx create-aletheia-skill@latest
```

Supports: **Claude Code · Gemini CLI / Antigravity · OpenAI Codex · Custom Agents**

---

## Privacy & Security

→ **[Full Privacy & Sandbox Architecture](Privacy.md)**

**Zero-knowledge architecture. Your data never reaches us.**

- All processing happens inside an isolated Docker container on your infrastructure
- The MCP server receives only algorithm IDs — never your data
- Container is destroyed after every audit
- GDPR-compatible by architecture
- Full self-host option for air-gap isolation

---

##  Agent Breakdowns

| Mode | Documentation |
|------|--------------|
| 📊 Dataset Audit Pipeline | [Dataset Agents — all 4 agents explained](DATASET_AGENTS.md) |
| 🤖 Model Audit Pipeline | [Model Agents — classification + regression](MODEL_AGENTS.md) |
| 🔬 Algorithm Reference | [13 Algorithms — MCP server explained](docs/algorithms.md) |

---

##  Tech Stack

### AI Orchestration
| Technology | Role |
|-----------|------|
| **LangGraph** | Multi-agent state machine orchestration |
| **Vertex AI / Gemini 3.1 Pro** | LLM backbone for all 4 agents |
| **MCP Protocol** | Custom tool/knowledge delivery servers |
| **Docker Sandbox** | Isolated Python REPL execution environment |

### Cloud & Infrastructure
| Technology | Role |
|-----------|------|
| **Google Cloud Run** | Auto-scaling frontend hosting |
| **Google Compute Engine** | Backend VM with Docker socket |
| **Artifact Registry** | Container image storage |
| **Secrets Manager** | Vertex AI credential storage |

### Backend & APIs
| Technology | Role |
|-----------|------|
| **FastAPI** | WebSocket streaming backend server |
| **Python 3.10+** | All agent logic and algorithm code |
| **WeasyPrint + matplotlib** | Server-side PDF generation |
| **NumPy / Pandas / SHAP / scipy** | ML computation |

### Frontend
| Technology | Role |
|-----------|------|
| **Next.js 14 / React** | AgenticFlow dashboard |
| **WebSocket** | Real-time agent output streaming |
| **Tailwind CSS** | Responsive observability UI |
| **JSON Schema-driven charts** | Dynamic chart rendering |

---

## Cost Estimate

| Component | Resource | Est. Cost / Month |
|-----------|---------|-------------------|
| Compute Engine (Backend) | 2× e2-standard-2 (2 vCPU, 8 GB RAM) | ~₹8,200 |
| Persistent Disk | 2× 50 GB balanced | ~₹900 |
| Static IP Address | 2× Attached Static IPs | ~₹500 |
| Cloud Run (Frontend) | Serverless Next.js, auto-scaling | ~₹0–500 |
| Artifact Registry | Docker images (~450 MB) | ~₹100 |
| Vertex AI API | Gemini 3.1 Pro, scales with volume | ~₹200–1,000 |
| **Total** | | **~₹11,000/month** |

---

##  Quick Start

### Using the Live MVP

```
https://aletheia-frontend-69262873588.us-central1.run.app/
```

1. Select **Dataset Audit** or **Model Audit**
2. Upload your file (CSV for datasets, .pkl/.joblib + sample.csv for models)
3. Watch the 4-agent pipeline run in real time
4. Download your PDF report and fixed output

### As a Claude Code Skill

```bash
npx create-aletheia-skill@latest
# Select: Claude Code → Import via Settings > Plugins
```

Then in Claude: *"The Aletheia sandbox container is already built. Audit this dataset: [attach file]"*

### Self-Hosting

```bash
git clone https://github.com/Aditya5191/Aletheia-AI
cd Aletheia-AI

# Build Docker sandbox
docker build -t sandbox-python:latest ./mcps/sandbox/

# Start backend
cd backend/dataset_backend
pip install -r requirements.txt
uvicorn backend.api:app --port 8005

# Start MCP servers
python mcps/sandbox/mcp_server.py &
python mcps/auditor/server.py &
python mcps/miscellaneous/server.py &

# Start frontend
cd frontend && npm install && npm run dev
```

---

##  Project Links

| Resource | Link |
|---------|------|
|  **Live MVP** | https://aletheia-frontend-69262873588.us-central1.run.app/ |
|  **Demo Video** | https://youtu.be/Xu2u8bvfD-w |
|  **GitHub Repository** | https://github.com/Aditya5191/Aletheia-AI |

---

##  Documentation Index

| File | Contents |
|------|---------|
| [`README.md`](README.md) | This file — full overview |
| [`docs/DATASET_AGENTS.md`](DATASET_AGENTS.md) | Dataset pipeline — all 4 agents, inputs, outputs |
| [`docs/MODEL_AGENTS.md`](MODEL_AGENTS.md) | Model pipeline — classification + regression agents |
| [`docs/ALGORITHMS.md`](ALGORITHMS.md) | All 13 MCP algorithms explained |
| [`docs/PLUGINS.md`](PLUGINS.md) | Plugin integration for Claude Code, Codex, Gemini CLI |
| [`docs/PRIVACY.md`](PRIVACY.md) | Privacy architecture, Docker isolation, self-hosting |

---

<div align="center">

[![Vertex AI](https://img.shields.io/badge/Powered%20by-Vertex%20AI%20%2F%20Gemini-4285F4?style=for-the-badge&logo=google-cloud)](https://cloud.google.com/vertex-ai)

</div>
