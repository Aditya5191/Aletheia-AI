# Aletheia: Enterprise Multi-Tenant Cloud Architecture

## Executive Summary
This document outlines the production-grade, multi-tenant deployment architecture for the Aletheia Algorithmic Fairness auditing platform. By leveraging Google Cloud Platform (GCP) serverless and managed services, the architecture guarantees absolute data isolation between concurrent users, infinite auto-scaling, and efficient memory management without the overhead of maintaining individual persistent Virtual Machines.

---

## High-Level Architecture Diagram

```mermaid
flowchart TB
    %% Styling and Colors
    classDef user fill:#2d3748,stroke:#a0aec0,stroke-width:2px,color:#fff,rx:10,ry:10;
    classDef frontend fill:#3182ce,stroke:#2b6cb0,stroke-width:2px,color:#fff,rx:5,ry:5;
    classDef lb fill:#ecc94b,stroke:#d69e2e,stroke-width:2px,color:#1a202c,rx:5,ry:5;
    classDef backend fill:#805ad5,stroke:#6b46c1,stroke-width:2px,color:#fff,rx:5,ry:5;
    classDef db fill:#38a169,stroke:#2f855a,stroke-width:2px,color:#fff,rx:20,ry:20;
    classDef sandbox fill:#e53e3e,stroke:#c53030,stroke-width:2px,color:#fff,stroke-dasharray: 5 5,rx:5,ry:5;
    classDef gcs fill:#d53f8c,stroke:#b83280,stroke-width:2px,color:#fff,rx:20,ry:20;
    classDef llm fill:#dd6b20,stroke:#c05621,stroke-width:2px,color:#fff,rx:5,ry:5;

    subgraph External["External Network"]
        direction LR
        U1(("👤 User 1")):::user
        U2(("👤 User 2")):::user
    end

    subgraph GCP["Google Cloud Platform (Serverless Infrastructure)"]
        direction TB
        
        %% Load Balancing & Frontend
        GLB{"🌐 Global Cloud Load Balancer"}:::lb
        FE["🖥️ AgenticFlow UI<br/>(Cloud Run)"]:::frontend
        
        %% Orchestration Tier
        subgraph Orchestration["🧠 Orchestration Tier (Highly Concurrent)"]
            direction TB
            API["⚡ FastAPI Server<br/>(WebSocket Manager)"]:::backend
            LG["🕸️ LangGraph State Machine<br/>(Thread Manager)"]:::backend
            SQL[("🗄️ Cloud SQL<br/>(LangGraph Checkpoints)")]:db
            LLM["🤖 Vertex AI<br/>(Gemini 1.5 Pro)"]:::llm
            
            API <-->|State Routing| LG
            LG <-->|Save/Load Thread| SQL
            LG <-->|Prompt Evaluation| LLM
        end
        
        %% Execution Tier
        subgraph Execution["⚙️ Execution Tier (Strict 1:1 User Isolation)"]
            direction LR
            ILB{"🔀 Internal Router<br/>(Session Affinity)"}:::lb
            
            SB1["📦 Cloud Run Sandbox A<br/>[Concurrency: 1]<br/>(User 1 Python State)"]:::sandbox
            SB2["📦 Cloud Run Sandbox B<br/>[Concurrency: 1]<br/>(User 2 Python State)"]:::sandbox
            
            ILB ==>|Header: Session=U1| SB1
            ILB ==>|Header: Session=U2| SB2
        end
        
        %% Storage Tier
        subgraph Storage["💾 Storage Tier (Data Isolation)"]
            direction LR
            Bucket[("📦 Cloud Storage Bucket<br/>(gs://aletheia)")]:gcs
            Dir1["📂 /user-1-workspace/"]:::gcs
            Dir2["📂 /user-2-workspace/"]:::gcs
            Bucket --- Dir1
            Bucket --- Dir2
        end
    end

    %% Edge Connections
    U1 -.->|1. Upload CSV directly| Dir1
    U2 -.->|1. Upload CSV directly| Dir2
    
    U1 ===|2. Connect WebSocket| GLB
    U2 ===|2. Connect WebSocket| GLB
    
    GLB -->|Serve React| FE
    GLB ===|Stream Events| API
    
    LG ===|3. Tool: execute_cell| ILB
    
    SB1 -.->|4. Read Data & Write PDF| Dir1
    SB2 -.->|4. Read Data & Write PDF| Dir2
    
    Dir1 -.->|5. Download via Signed URL| U1
    Dir2 -.->|5. Download via Signed URL| U2
```

---

## Component Breakdown & Responsibilities

### 1. The Client Tier
*   **Next.js Frontend:** A statically hosted or serverless-rendered UI that connects to the backend via WebSocket. It never handles files directly; it streams files to the backend and downloads outputs via Signed URLs to minimize middle-man bottlenecks.

### 2. The Orchestration Tier
*   **FastAPI Backend (Cloud Run):** Acts as the asynchronous traffic controller. It receives user inputs, handles authentication, and maintains the WebSocket connections. It easily handles thousands of concurrent connections because it delegates heavy processing instantly.
*   **LangGraph Engine & Checkpointer (Cloud SQL):** The brain of the operation. LangGraph routes the agents and strictly enforces memory boundaries. Every user session generates a unique `thread_id`. Before LangGraph evaluates an agent prompt, it queries the Cloud SQL database using this `thread_id`, guaranteeing User 1 never accesses User 2's conversation history.

### 3. The Execution Tier (Sandboxes)
*   **Serverless Python Kernels (Cloud Run):** The core computational workload is pushed to isolated containers. Each container holds the Python data science stack (`pandas`, `scipy`, `cvxpy`, etc.).
*   **Session Affinity Routing:** To maintain variables in Python memory across multiple sequential agent steps, GCP Load Balancing utilizes "Session Affinity." All requests tagged with User 1's ID are routed to Instance A. Requests tagged with User 2 are routed to Instance B. Cloud Run restricts concurrency to `1` per instance, forcing GCP to instantly cold-start a fresh instance if a new user arrives.

### 4. The Data & Storage Tier
*   **Google Cloud Storage (GCS):** The single source of truth for files. The local VM disk is entirely bypassed. Files are strictly partitioned by user prefixes (e.g., `gs://aletheia-workspaces/user-123/`).

---

## Security & Isolation Guarantees

| Security Vector | Mitigation Strategy | Guarantee |
| :--- | :--- | :--- |
| **Data Bleed** | GCS Bucket Prefixing | User A physically cannot read `gs://.../user-B/` files. |
| **Context Bleed** | LangGraph `thread_id` | The LLM context window is strictly bound to the database row of the active session. |
| **Compute Hijacking** | Cloud Run Sandboxing | Code execution is isolated. Even if a user executes a malicious `os.system` command, it executes inside a transient, non-root, restricted-network Cloud Run instance that is destroyed upon session end. |
| **DDoS / Overload** | Async + Auto-Scaling | The FastAPI orchestrator does not block on execution. It waits asynchronously, allowing GCP to scale up Execution instances seamlessly without crashing the master router. |
