# Aletheia AI - Deployment Architecture

This document outlines the dual-VM production deployment architecture for Aletheia AI. We split the backend workloads across two separate Virtual Machines to prevent out-of-memory crashes during heavy LangGraph executions, and host the frontend on serverless infrastructure.

## Infrastructure Overview

```mermaid
flowchart LR
    classDef gcp fill:#F8F9FA,stroke:#4285F4,stroke-width:2px,color:#202124,rx:10px,ry:10px
    classDef serverless fill:#F3E8FF,stroke:#9333EA,stroke-width:2px,color:#4C1D95,rx:5px,ry:5px
    classDef vm fill:#E6F4EA,stroke:#1E8E3E,stroke-width:2px,color:#0D652D,rx:5px,ry:5px
    classDef container fill:#FEF7E0,stroke:#F29900,stroke-width:2px,color:#B06000,rx:5px,ry:5px
    classDef registry fill:#E4F7FB,stroke:#12B5CB,stroke-width:2px,color:#008396,rx:5px,ry:5px
    classDef user fill:#F1F3F4,stroke:#9AA0A6,stroke-width:2px,color:#202124,rx:10px,ry:10px
    classDef din fill:#FFFFFF,stroke:#F29900,stroke-width:1px,stroke-dasharray: 5 5,color:#B06000,rx:5px,ry:5px

    User((User)):::user

    subgraph GCP [Google Cloud Platform us-central1]
        
        subgraph CloudRun [Cloud Run Serverless]
            Frontend[AgenticFlow Frontend<br>Next.js Standalone]:::serverless
        end

        subgraph ArtifactRegistry [Artifact Registry]
            Images[Docker Images]:::registry
        end

        subgraph VM1 [Compute Engine e2-standard-2<br>Dataset Auditor VM]
            direction TB
            subgraph Backend1 [Backend Container]
                FastAPI1[FastAPI Server Port 8005]:::container
                LangGraph1[LangGraph + MCP Orchestrator]:::container
                FastAPI1 -->|Function Calls| LangGraph1
            end
            
            subgraph DinD1 [Ephemeral Sandboxes DinD]
                Sandbox1[Docker Sandbox 1 ... Docker Sandbox N]:::din
            end
            LangGraph1 -->|/var/run/docker.sock| DinD1
            DinD1 -.->|docker cp Sync Outputs| Backend1
        end

        subgraph VM2 [Compute Engine e2-standard-2<br>Model Auditor VM]
            direction TB
            subgraph Backend2 [Backend Container]
                FastAPI2[FastAPI Server Port 8006]:::container
                LangGraph2[LangGraph + MCP Orchestrator]:::container
                FastAPI2 -->|Function Calls| LangGraph2
            end
            
            subgraph DinD2 [Ephemeral Sandboxes DinD]
                Sandbox2[Docker Sandbox 1 ... Docker Sandbox N]:::din
            end
            LangGraph2 -->|/var/run/docker.sock| DinD2
            DinD2 -.->|docker cp Sync Outputs| Backend2
        end
    end

    User -->|HTTPS Port 443| Frontend
    User -.->|WebSocket / HTTPS via sslip.io| FastAPI1
    User -.->|WebSocket / HTTPS via sslip.io| FastAPI2

    Images -.->|Pulls Image| Frontend
    Images -.->|Pulls Image| Backend1
    Images -.->|Pulls Image| Backend2

    class GCP gcp
    class CloudRun serverless
    class ArtifactRegistry registry
    class VM1 vm
    class VM2 vm
    class Backend1 container
    class Backend2 container
    class DinD1 container
    class DinD2 container
```

### Components:
1. **Frontend (Google Cloud Run):** A serverless Next.js container deployed in `us-central1` that securely routes the user's interface.
2. **Dataset Auditor VM (`aletheia-dataset-vm`):** A dedicated Compute Engine instance with a reserved static IP, exposing port `8005`. It handles dataset parsing, auditing, and proxy mitigation via its internal Docker Sandbox.
3. **Model Auditor VM (`aletheia-model-vm`):** A dedicated Compute Engine instance with a reserved static IP, exposing port `8006`. It executes heavy predictive models, generates SHAP values, and runs counterfactual fairness tests.
