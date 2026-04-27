# AgenticFlow: Forensic AI Observability Dashboard

AgenticFlow is a high-fidelity, professional AI observability and orchestration dashboard built for deep forensic analysis of AI agent pipelines. It provides real-time visualization of multi-agent interactions, tool-call tracing, and dataset disparity auditing with a premium "Clinical Observer" aesthetic.

## Key Features

### 1. Interactive Flow Canvas & Live Agent Orchestration
- **Dynamic Node Orchestration:** Powered by React Flow, allowing for fluid manipulation of the agent pipeline.
- **Agent Nodes:** Custom-built nodes with integrated "Run" functionality and real-time status badges powered by WebSocket streaming.
- **Docker Sandbox Node:** Visualizes the lifecycle of the isolated Docker environment in real-time, accurately transitioning through Spawning, Running, and Stopped states synchronously with the backend.
- **Interactive Dataset Uploads:** Drag-and-drop CSV node that mounts data directly into the remote execution environment.

### 2. Forensic Auditing & Live Stream Execution
- **WebSocket Streaming:** The entire frontend executes live with the FastAPI backend, dynamically streaming LangGraph agent events and execution paths.
- **Automated Discovery:** Branching attribute nodes that dynamically spawn after the Data Surveyor inspects the mounted dataset.
- **Disparity Visualization:** Intelligent path highlighting that turns nodes and edges **Red** when the Fairness Adjudicator detects bias in the data.

### 3. Deep-Dive Observability Modal
- **Analytics Tab:** High-performance SVG charts (Line, Pie, Scatter, and fully-responsive Interactive Bar Charts).
- **Interactive Heatmaps:** Specialized correlation matrix visualizer with **Dynamic Contrast Normalization** and a live color legend bar.
- **Code Tab:** Real-time execution notebook. Captured AI-generated Python logic (pandas, sklearn) as it runs in the Docker Sandbox, with status tracking and 1-click copy functionality.
- **Review Tab:** Comprehensive markdown-based reports providing qualitative insights into agent verdicts.
- **Report Compiler:** Dedicated final node that aggregates all previous agent outputs, generates a stylized HTML/CSS template, and compiles a publication-quality **PDF** via WeasyPrint directly from the frontend.

### 4. Dual View Modes
- **Developer Mode:** Full observability with terminal-style tool-call logs and technical metadata for deep debugging.
- **User Mode:** A clean, simplified dashboard view that hides technical logs for a focused executive summary.

## Tech Stack
- **Frontend:** Next.js 14, React 18, TypeScript
- **Flow Engine:** React Flow (@xyflow/react)
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **Visualizations:** Custom highly-responsive SVGs with RGB color interpolation for heatmaps.
- **Data Sync:** Real-time artifact polling from the FastAPI backend (Port 8005).
- **Animations:** CSS3 Keyframes (Custom "Live Drawing" and container spawning effects)

## Project Structure
- `/app`: Next.js page routes and global styles.
- `/components`:
  - `AgentNode.tsx`: The core agent logic and UI.
  - `DockerNode.tsx`: Sandbox environment visualizer.
  - `UploadNode.tsx`: Drag-and-drop CSV ingestion UI.
  - `AttributeNode.tsx`: Minimalist nodes for dataset features.
  - `NodeDetailModal.tsx`: The deep-dive inspection interface with dynamic charts.
  - `FlowCanvas.tsx`: The main orchestrator for the graph and WebSocket connection.
  - `TopAppBar.tsx`: Global navigation and view-mode toggle.
  - `ViewModeContext.tsx`: Context-based state management for UI modes.

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- The Aletheia Backend must be running (see the root README)

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend/agenticflow
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Workflow Guide
1. **Upload Dataset:** Drag and drop your target CSV onto the Upload Data node.
2. **Initiate Execution:** Click **RUN** on the "Data Inspector" node to trigger the WebSocket execution.
3. **Watch the Sandbox:** The Docker Sandbox node will spin up, indicating the secure environment is live.
4. **Live Execution:** Watch the attribute nodes branch out and observe the multi-agent orchestration dynamically lighting up the graph.
5. **Inspect Results:** Click on any agent node to open the forensic detail modal, view executed code, read bias reports, and interact with the dynamically-scaled negative-value charts.

---
Built with 💜 for advanced AI Observability.
