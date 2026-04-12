# Lusitània: MCP Fairness Auditing Server

## Overview
**Lusitània** introduces a state-of-the-art hybrid Model Context Protocol (MCP) architecture. Rather than relying on rigid Python API endpoints, this server leverages a **Knowledge Skill Delivery Model**, providing granular pseudo-code, mathematical bounds, and causal constraints dynamically to LLM-driven agents (e.g., Claude Desktop, LM Studio). 

This allows agents to natively compile, execute, and sandbox dynamic fairness models tightly aligned with production data without encountering the typical constraints of external web services.

## Architecture (Pure Math vs Frameworks)
*   **Server Core**: Built on `FastMCP` (`server.py`), acting as a dynamic tool registry.
*   **Dual-Knowledge Delivery**: The system differentiates structurally between two execution bounds:
    *   **PURE Algorithms**: Straightforward mathematical paths logically constrained, delivered natively as pure markdown pseudo-code.
    *   **FRAMEWORK Pipelines**: Complex, multi-step Directed Acyclic Graphs (DAGs) natively tracked via YAML (`framework.yaml`). Upon fetching, the server actively concatenates a localized `framework_scaffold.py` state-passing looping machine securely into the agent's context! This definitively eliminates monolithic code hallucinations dynamically natively securely mapping conditional step triggers gracefully safely cleanly!
*   **Routing System**: `get_algorithm_info` ensures Agents reliably map domain compatibility (Hiring, Finance, Healthcare, Recidivism) avoiding mathematically impossible implementations (e.g., using Causal Inference algorithms on datasets heavily plagued by unmeasured confounders).

## Implemented Algorithms

The server hosts a comprehensive suite of 10 deeply optimized algorithms bridging statistical proxy detection to causal decomposition:

- **Algo 1: Disparate Impact (80% Rule)** - BER-based threshold modeling and quantile-based continuous feature transformation.
- **Algo 2: Equality of Opportunity** - Optimization of strict TPR/FPR limits mapping classification boundaries seamlessly.
- **Algo 3: Recidivism Fairness** - Maps the formal Impossibility Theorems tracking Base Rate Discrepancies safely mapping FP vs FN impacts.
- **Algo 4: Intersectional Subgroup Scan** - A combinatoric tree-scanner navigating overlapping minority vectors mapping complex bounds cleanly. 
- **Algo 5: Mutual Information Proxy Scanner** - Information-theoretic estimators targeting continuous dependency bounds (k-NN / KSG limits).
- **Algo 6: Brownian Distance Covariance (dCor)** - Maps double-centered non-linear $O(N^2)$ proxy bounds natively.
- **Algo 7: SHAP Axiomatic Feature Attribution** - Identifies game-theoretic variables highlighting redundant proxy discrimination loops mathematically.
- **Algo 9: Causal Fair Inference** - Maps exact Path-Specific Effects (PSE) utilizing strictly bounded Constrained Maximum Likelihood Estimations (MLE) limiting proxy pathways securely.
- **Algo 10: Counterfactual Fairness (Orthogonal to Bias)** - Mathematically maps exact Singular Value Decomposition (SVD) loops strictly forcing zero covariance against explicitly defined sensitive metrics natively.
- **Algo 11: Causal explanation Formula (Mechanism Decomposition)** - Evaluates exact structural Total Variation paths separating specific loops allocating limits targeting safe Affirmative Action natively safely limiting reverse discrimination dynamically.

## Installation & Setup
### Dependencies
Install specific required constraints:
```bash
pip install mcp numpy pandas scipy scikit-learn
```

### Claude Desktop Integration
Modify your `claude_desktop_config.json` inside your `%APPDATA%\Claude` directory:
```json
{
  "mcpServers": {
    "lusitania-auditor": {
      "command": "python",
      "args": ["C:\\path\\to\\your\\MCP\\server.py"]
    }
  }
}
```

## Agent Operational Guidelines
To instruct an LLM leveraging this exact server, provide the following structural command sequence:
1. Call `get_algorithm_info` explicitly reading the target's `"type"` field (`PURE` vs `FRAMEWORK`).
2. Request `load_algorithm_knowledge` isolating the returned outputs. 
   - If `"type": "PURE"`, write the logic dynamically correctly accurately matching the markdown bounds.
   - If `"type": "FRAMEWORK"`, you **MUST** invoke the provided Python State-Machine Scaffold (`execute_framework_pipeline`), and fill out its conditional logic specifically pointing to the YAML DAG steps sequentially.
3. Write exact structural native sandbox mappings intelligently properly cleanly exactly.

*Note: The server avoids emojis tracking structural datasets.*
