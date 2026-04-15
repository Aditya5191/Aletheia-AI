import json
import os
from typing import List, Dict, Any, Optional, Union
from mcp.server.fastmcp import FastMCP

# Create MCP server instance
mcp = FastMCP("FairnessAlgorithmsServer")

@mcp.tool()
def get_algorithm_info(algorithm_id: str = "all") -> str:
    """
    Get detailed documentation about an algorithmic knowledge skill.
    Call this tool to learn what the algorithm calculates and what domains it applies to.
    """
    registry = {
        "algo1": {
            "name": "Certifying and Removing Disparate Impact (Knowledge Skill)",
            "type": "PURE",
            "purpose": "Detects and removes disparate impact in datasets via pre-processing by equalizing distributions across protected groups while preserving candidate ranks.",
            "best_suited_for": ["Hiring & HR", "Lending & Finance", "Education"],
            "not_suited_for": ["Criminal Justice (due to label bias)", "Healthcare (if extreme accuracy loss is harmful without clinical context)"],
            "tools_provided": [
                {
                    "tool_name": "load_algorithm_knowledge",
                    "description": "Loads the algorithmic pseudo-code and schemas into the agent context.",
                    "inputs_schema": {
                        "algorithm_id": "String. Set to 'algo1'."
                    }
                }
            ]
        },
        "algo2": {
            "name": "Equality of Opportunity in Supervised Learning (Knowledge Skill)",
            "type": "PURE",
            "purpose": "Provides post-processing threshold optimizations to enforce equalized odds (TPR/FPR equalized) or equal opportunity (TPR equalized) directly on outputs without retraining.",
            "best_suited_for": ["Hiring & HR", "Lending & Finance", "Education"],
            "not_suited_for": ["Criminal Justice (due to mathematical base-rate proxy bias)"],
            "tools_provided": [
                {
                    "tool_name": "load_algorithm_knowledge",
                    "description": "Loads the mathematical logic guiding TPR/FPR ROC post-processing.",
                    "inputs_schema": {
                        "algorithm_id": "String. Set to 'algo2'."
                    }
                }
            ]
        },
        "algo3": {
            "name": "Fair Prediction with Disparate Impact - Recidivism (Knowledge Skill)",
            "type": "PURE",
            "purpose": "Framework diagnosing the theoretical impossibility of balancing Predictive Parity and Error Rate Balance when base rates differ, calibrating optimal tradeoff thresholds.",
            "best_suited_for": ["Criminal Justice", "Lending & Finance"],
            "not_suited_for": ["Education (interventions alter logic matrices)", "Healthcare (without clinical harm-weight tables)"],
            "tools_provided": [
                {
                    "tool_name": "load_algorithm_knowledge",
                    "description": "Loads the mathematical theorem proof logic governing cost-calibrated strategy boundaries.",
                    "inputs_schema": {
                        "algorithm_id": "String. Set to 'algo3'."
                    }
                }
            ]
        },
        "algo4": {
            "name": "Intersectional Subgroup Scan for Fairness Auditing & Mitigation (Knowledge Skill)",
            "type": "FRAMEWORK",
            "purpose": "Efficiently identifies and remediates fairness gerrymandering manifesting exclusively inside highly specific, intersecting demographic subgroups via combinatorial scanning.",
            "best_suited_for": ["Hiring & HR", "Lending & Finance", "Education"],
            "not_suited_for": ["Criminal Justice (label validity overrides)", "Healthcare (clinical context required)"],
            "tools_provided": [
                {
                    "tool_name": "load_algorithm_knowledge",
                    "description": "Loads algorithmic rules for scanning and mutating boolean subgroup structures.",
                    "inputs_schema": {
                        "algorithm_id": "String. Set to 'algo4'."
                    }
                }
            ]
        },
        "algo5": {
            "name": "Mutual Information Proxy Scanner for Algorithmic Fairness (Knowledge Skill)",
            "type": "FRAMEWORK",
            "purpose": "Detects and residualizes non-linear proxy discrimination features leaking protected attribute intelligence using formal information theory and conditionally decorrelating residuals.",
            "best_suited_for": ["Hiring & HR", "Lending & Finance", "Education"],
            "not_suited_for": ["Criminal Justice (systematic biased labels skew decorrelation vectors)"],
            "tools_provided": [
                {
                    "tool_name": "load_algorithm_knowledge",
                    "description": "Loads rules for detecting predictive proxy dependencies formally via MI estimators.",
                    "inputs_schema": {
                        "algorithm_id": "String. Set to 'algo5'."
                    }
                }
            ]
        },
        "algo6": {
            "name": "Brownian Distance Covariance Scanner (Knowledge Skill)",
            "type": "PURE",
            "purpose": "Assumption-free detection and non-linear decorrelation of arbitrary proxy relationships between features and protected attributes using pairwise Euclidean distance matrices. Capable of mapping U-shaped proxy bounds.",
            "best_suited_for": ["Hiring & HR", "Lending & Finance", "Education"],
            "not_suited_for": ["Criminal Justice (label validity)", "Big Data (O(N^2) memory bounds restrict datasets natively >30k rows)"],
            "tools_provided": [
                {
                    "tool_name": "load_algorithm_knowledge",
                    "description": "Loads rules for double-centering distance matrices computing pure dCor independence limits.",
                    "inputs_schema": {
                        "algorithm_id": "String. Set to 'algo6'."
                    }
                }
            ]
        },
        "algo7": {
            "name": "SHAP Values for Proxy Detection & Redundancy Auditing (Knowledge Skill)",
            "type": "FRAMEWORK",
            "purpose": "Axiomatic, game-theoretic feature attribution identifying covert proxies natively by exactly quantifying model reliance and penalizing biased dependency via structural reweighting.",
            "best_suited_for": ["Hiring & HR", "Lending & Finance", "Education"],
            "not_suited_for": ["Black-box APIs (requires model access)", "Deep NLP tasks (requires explicit tabular feature matrices)"],
            "tools_provided": [
                {
                    "tool_name": "load_algorithm_knowledge",
                    "description": "Loads rules for calculating weighted Kernel SHAP matrices detecting redundant proxies.",
                    "inputs_schema": {
                        "algorithm_id": "String. Set to 'algo7'."
                    }
                }
            ]
        },
        "algo9": {
            "name": "Causal Fair Inference & Path-Specific Effect Mitigation (Knowledge Skill)",
            "type": "PURE",
            "purpose": "Estimates and mitigates direct causal discrimination pathways (Path-Specific Effects) using Inverse Probability Weighting (IPW) and Constrained Maximum Likelihood Estimation.",
            "best_suited_for": ["Hiring & HR", "Lending & Finance", "Education"],
            "not_suited_for": ["Criminal Justice (fails when heavy unmeasured confounding corrupts models)", "Healthcare"],
            "tools_provided": [
                {
                    "tool_name": "load_algorithm_knowledge",
                    "description": "Loads strict causal estimation rules bounding NDE/PSE optimization constraints.",
                    "inputs_schema": {
                        "algorithm_id": "String. Set to 'algo9'."
                    }
                }
            ]
        },
        "algo10": {
            "name": "Counterfactual Fairness through Data Orthogonalization (Knowledge Skill)",
            "type": "FRAMEWORK",
            "purpose": "A model-agnostic pre-processing technique ensuring mathematical Counterfactual Fairness by executing closed-form SVD transformations generating features mathematically orthogonal to bias.",
            "best_suited_for": ["Hiring & HR", "Lending & Finance", "Education"],
            "not_suited_for": ["Criminal Justice (label validity overrides pre-processing limits)"],
            "tools_provided": [
                {
                    "tool_name": "load_algorithm_knowledge",
                    "description": "Loads strictly executed closed-form OB tracking zero-covariance limits.",
                    "inputs_schema": {
                        "algorithm_id": "String. Set to 'algo10'."
                    }
                }
            ]
        },
        "algo11": {
            "name": "Causal Explanation Formula Mechanism Decomposition (Knowledge Skill)",
            "type": "PURE",
            "purpose": "Isolates and mathematically decomposes Total Variation into Direct, Indirect, and Spurious Counterfactual effects, enabling Narrow Tailoring Affirmative Action policy design.",
            "best_suited_for": ["Hiring & HR", "Lending & Finance", "Education"],
            "not_suited_for": ["Criminal Justice (unmeasured confounding corrupts results)"],
            "tools_provided": [
                {
                    "tool_name": "load_algorithm_knowledge",
                    "description": "Loads decomposition tracking math models enabling Affirmative Action bounds.",
                    "inputs_schema": {
                        "algorithm_id": "String. Set to 'algo11'."
                    }
                }
            ]
        },
        "algo12": {
            "name": "Fairness Feedback Loops & Algorithmic Reparation (Knowledge Skill)",
            "type": "FRAMEWORK",
            "purpose": "Tracks Model-Induced Distribution Shifts (MIDS) across model generations detecting fairness decay, model collapse, and minoritized group erasure. Mitigates via STratified Algorithmic Reparation (STAR) quota-based batch curation enforcing intersectional representation.",
            "best_suited_for": ["Hiring & HR", "Lending & Finance", "Education"],
            "not_suited_for": ["Criminal Justice (systemic label bias; uniform quotas misalign with structural inequities)", "Healthcare (clinical harm asymmetry conflicts with uniform STAR quotas)"],
            "tools_provided": [
                {
                    "tool_name": "load_algorithm_knowledge",
                    "description": "Loads generational MIDS tracking pipeline and STAR reparative batch sampler.",
                    "inputs_schema": {
                        "algorithm_id": "String. Set to 'algo12'."
                    }
                }
            ]
        },
        "algo13": {
            "name": "Fairness Without Demographics via DRO (Knowledge Skill)",
            "type": "FRAMEWORK",
            "purpose": "Controls worst-case group risk without demographic labels using chi-squared Distributionally Robust Optimization. Detects disparity amplification via retention dynamics simulation and Jacobian spectral analysis. Mitigates via dual-variable SGD that automatically upweights high-loss examples.",
            "best_suited_for": ["Healthcare", "Lending & Finance", "Education"],
            "not_suited_for": ["Criminal Justice (legally mandated parity requires explicit labels)", "Hiring & HR (discrete cycles limit feedback dynamics)"],
            "tools_provided": [
                {
                    "tool_name": "load_algorithm_knowledge",
                    "description": "Loads DRO dual optimization pipeline and disparity amplification auditor.",
                    "inputs_schema": {
                        "algorithm_id": "String. Set to 'algo13'."
                    }
                }
            ]
        },
        "algo14": {
            "name": "Fairness in Relational Domains - FairPSL (Knowledge Skill)",
            "type": "FRAMEWORK",
            "purpose": "Audits and enforces fairness in relational/networked domains using First-Order Logic discrimination patterns and convex MAP inference with linear fairness constraints (Risk Difference, Risk Ratio, Relative Chance).",
            "best_suited_for": ["Hiring & HR", "Education", "Lending & Finance"],
            "not_suited_for": ["Criminal Justice (structural bias and label validity issues)", "Healthcare (relational patterns may encode legitimate clinical pathways)"],
            "tools_provided": [
                {
                    "tool_name": "load_algorithm_knowledge",
                    "description": "Loads FOL-based relational fairness detection and constrained PSL MAP inference pipeline.",
                    "inputs_schema": {
                        "algorithm_id": "String. Set to 'algo14'."
                    }
                }
            ]
        }
    }
    
    algorithm_id = algorithm_id.strip()
    if algorithm_id.lower() == "all":
        menu = {k: {"name": v["name"], "type": v["type"], "purpose": v["purpose"]} for k, v in registry.items()}
        return json.dumps({"available_algorithms": menu}, indent=2)
        
    if algorithm_id in registry:
        return json.dumps(registry[algorithm_id], indent=2)
    return json.dumps({"error": f"Algorithm '{algorithm_id}' not found in registry."})


@mcp.tool()
def list_algorithms() -> str:
    """
    Lists all available fairness algorithms registered in the Lusitània MCP server.
    Use this to see the full menu of IDs before calling get_algorithm_info or load_algorithm_knowledge.
    """
    registry = {
        "algo1": "Certifying and Removing Disparate Impact",
        "algo2": "Equality of Opportunity in Supervised Learning",
        "algo3": "Fair Prediction with Disparate Impact - Recidivism",
        "algo4": "Intersectional Subgroup Scan",
        "algo5": "Mutual Information Proxy Scanner",
        "algo6": "Brownian Distance Covariance Scanner",
        "algo7": "SHAP Values for Proxy Detection",
        "algo9": "Causal Fair Inference",
        "algo10": "Counterfactual Fairness (Orthogonal to Bias)",
        "algo11": "Causal Explanation Formula",
        "algo12": "Fairness Feedback Loops & Algorithmic Reparation",
        "algo13": "Fairness Without Demographics via DRO",
        "algo14": "Fairness in Relational Domains (FairPSL)"
    }
    return json.dumps({"algorithms": registry}, indent=2)


@mcp.tool()
def load_algorithm_knowledge(algorithm_id: str) -> str:
    """
    Loads the knowledge skill directly into the agent's context 
    window so the agent can write the implementation securely into the user's local script.
    
    Args:
        algorithm_id: Identifier of the algorithm (e.g., "algo1", "algo2", "algo3").
    """
    algorithm_id = algorithm_id.strip()
    valid_algos = {
        "algo1": "PURE", "algo2": "PURE", "algo3": "PURE", "algo4": "FRAMEWORK", 
        "algo5": "FRAMEWORK", "algo6": "PURE", "algo7": "FRAMEWORK", "algo9": "PURE",
        "algo10": "FRAMEWORK", "algo11": "PURE", "algo12": "FRAMEWORK", "algo13": "FRAMEWORK",
        "algo14": "FRAMEWORK"
    }
    
    if algorithm_id in valid_algos:
        algo_type = valid_algos[algorithm_id]
        if algo_type == "PURE":
            file_path = os.path.join(os.path.dirname(__file__), algorithm_id, "knowledge.md")
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            except Exception as e:
                return f"Error loading knowledge MD file for {algorithm_id}: {str(e)}"
        elif algo_type == "FRAMEWORK":
            yaml_path = os.path.join(os.path.dirname(__file__), algorithm_id, "framework.yaml")
            scaffold_path = os.path.join(os.path.dirname(__file__), "framework_scaffold.py")
            try:
                with open(yaml_path, 'r', encoding='utf-8') as f:
                    yaml_content = f.read()
                with open(scaffold_path, 'r', encoding='utf-8') as f:
                    scaffold_content = f.read()
                
                # Prepend the scaffold logic to the YAML output securely
                return (f"=== PYTHON STATE MACHINE SCAFFOLD ===\n"
                        f"IMPORTANT: You MUST use the exact scaffold below to run the framework steps.\n\n"
                        f"{scaffold_content}\n\n"
                        f"=== FRAMEWORK YAML PIPELINE DAG ===\n"
                        f"IMPORTANT: Execute the scaffold mapped strictly to these steps:\n\n"
                        f"{yaml_content}")
            except Exception as e:
                return f"Error loading framework YAML or scaffold for {algorithm_id}: {str(e)}"
    
    return f"Knowledge skill not configured yet for {algorithm_id}."


if __name__ == "__main__":
    import sys
    port = os.environ.get("PORT")
    if port:
        # Railway / cloud deployment: run SSE transport over HTTP
        mcp.run(transport="sse", host="0.0.0.0", port=int(port))
    else:
        # Local: run stdio transport (Claude Desktop, Cursor)
        mcp.run()
