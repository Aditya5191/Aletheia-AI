import json
import os
from typing import List, Dict, Any, Optional, Union
from fastmcp import FastMCP

# Create MCP server instance
mcp = FastMCP("FairnessAlgorithmsServer")

@mcp.tool()
def get_algorithm_info(algorithm_id: str = "all", reason: str = "") -> str:
    """
    Get detailed documentation about an algorithmic knowledge skill.
    Call this tool to learn what the algorithm calculates and what domains it applies to.
    
    Args:
        algorithm_id: Identifier of the algorithm. Pass 'all' to get the full registry.
        reason: CRITICAL: MAXIMUM 5 WORDS. Describe what you are trying to achieve. E.g., 'Checking for missing values'.
    """
    registry = {
        "disparate_impact_repair": {
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
                        "algorithm_id": "String. Set to 'disparate_impact_repair'."
                    }
                }
            ]
        },
        "equality_of_opportunity": {
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
                        "algorithm_id": "String. Set to 'equality_of_opportunity'."
                    }
                }
            ]
        },
        "recidivism_fairness_calibration": {
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
                        "algorithm_id": "String. Set to 'recidivism_fairness_calibration'."
                    }
                }
            ]
        },
        "intersectional_subgroup_scan": {
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
                        "algorithm_id": "String. Set to 'intersectional_subgroup_scan'."
                    }
                }
            ]
        },
        "mutual_info_proxy_scanner": {
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
                        "algorithm_id": "String. Set to 'mutual_info_proxy_scanner'."
                    }
                }
            ]
        },
        "brownian_distance_covariance": {
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
                        "algorithm_id": "String. Set to 'brownian_distance_covariance'."
                    }
                }
            ]
        },
        "shap_proxy_detection": {
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
                        "algorithm_id": "String. Set to 'shap_proxy_detection'."
                    }
                }
            ]
        },
        "causal_fair_inference": {
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
                        "algorithm_id": "String. Set to 'causal_fair_inference'."
                    }
                }
            ]
        },
        "counterfactual_orthogonalization": {
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
                        "algorithm_id": "String. Set to 'counterfactual_orthogonalization'."
                    }
                }
            ]
        },
        "causal_explanation_formula": {
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
                        "algorithm_id": "String. Set to 'causal_explanation_formula'."
                    }
                }
            ]
        },
        "fairness_feedback_reparation": {
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
                        "algorithm_id": "String. Set to 'fairness_feedback_reparation'."
                    }
                }
            ]
        },
        "dro_fairness_no_demographics": {
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
                        "algorithm_id": "String. Set to 'dro_fairness_no_demographics'."
                    }
                }
            ]
        },
        "relational_fairness_psl": {
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
                        "algorithm_id": "String. Set to 'relational_fairness_psl'."
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
def list_algorithms(reason: str = "") -> str:
    """
    Lists all available fairness algorithms registered in the Aletheia MCP server.
    Use this to see the full menu of IDs and their basic descriptions before calling get_algorithm_info or load_algorithm_knowledge.
    
    Args:
        reason: CRITICAL: MAXIMUM 5 WORDS. Describe what you are trying to achieve. E.g., 'Checking for missing values'.
    """
    registry = {
        "disparate_impact_repair": "Certifying and Removing Disparate Impact (Pre-processing distribution alignment)",
        "equality_of_opportunity": "Equality of Opportunity in Supervised Learning (Post-processing threshold optimization)",
        "recidivism_fairness_calibration": "Fair Prediction with Disparate Impact - Recidivism (Tradeoff calibration for base rate differences)",
        "intersectional_subgroup_scan": "Intersectional Subgroup Scan (Combinatorial gerrymandering detection)",
        "mutual_info_proxy_scanner": "Mutual Information Proxy Scanner (Non-linear proxy residualization)",
        "brownian_distance_covariance": "Brownian Distance Covariance Scanner (Non-linear decorrelation via distance matrices)",
        "shap_proxy_detection": "SHAP Values for Proxy Detection (Axiomatic feature attribution auditing)",
        "causal_fair_inference": "Causal Fair Inference (Path-Specific Effect mitigation)",
        "counterfactual_orthogonalization": "Counterfactual Fairness (Data Orthogonalization via SVD)",
        "causal_explanation_formula": "Causal Explanation Formula (Mechanism decomposition SE/IE/DE)",
        "fairness_feedback_reparation": "Fairness Feedback Loops & Algorithmic Reparation (Generational MIDS tracking & STAR quotas)",
        "dro_fairness_no_demographics": "Fairness Without Demographics via DRO (Distributionally Robust Optimization)",
        "relational_fairness_psl": "Fairness in Relational Domains (FairPSL - Probabilistic Soft Logic)"
    }
    return json.dumps({"algorithms": registry}, indent=2)


@mcp.tool()
def load_algorithm_knowledge(algorithm_id: str, reason: str = "") -> str:
    """
    Loads the knowledge skill directly into the agent's context 
    window so the agent can write the implementation securely into the user's local script.
    
    Args:
        algorithm_id: Identifier of the algorithm (e.g., "disparate_impact_repair", "intersectional_subgroup_scan").
        reason: CRITICAL: MAXIMUM 5 WORDS. Describe what you are trying to achieve. E.g., 'Checking for missing values'.
    """
    from pathlib import Path

    algorithm_id = algorithm_id.strip().lower()
    valid_algos = {
        "disparate_impact_repair": "PURE", 
        "equality_of_opportunity": "PURE", 
        "recidivism_fairness_calibration": "PURE", 
        "intersectional_subgroup_scan": "FRAMEWORK", 
        "mutual_info_proxy_scanner": "FRAMEWORK", 
        "brownian_distance_covariance": "PURE", 
        "shap_proxy_detection": "FRAMEWORK", 
        "causal_fair_inference": "PURE",
        "counterfactual_orthogonalization": "FRAMEWORK", 
        "causal_explanation_formula": "PURE", 
        "fairness_feedback_reparation": "FRAMEWORK", 
        "dro_fairness_no_demographics": "FRAMEWORK",
        "relational_fairness_psl": "FRAMEWORK"
    }
    
    if algorithm_id not in valid_algos:
        return f"Unknown algorithm_id: '{algorithm_id}'. Valid: {', '.join(sorted(valid_algos.keys()))}"

    base_dir = Path(__file__).resolve().parent
    algo_type = valid_algos[algorithm_id]

    if algo_type == "PURE":
        file_path = base_dir / algorithm_id / "knowledge.md"
        try:
            return file_path.read_text(encoding='utf-8')
        except FileNotFoundError:
            return f"File not found: {file_path}"
        except Exception as e:
            return f"Error loading {file_path}: {e}"
    else:
        yaml_path = base_dir / algorithm_id / "framework.yaml"
        scaffold_path = base_dir / "framework_scaffold.py"
        try:
            yaml_content = yaml_path.read_text(encoding='utf-8')
        except FileNotFoundError:
            return f"File not found: {yaml_path}"
        except Exception as e:
            return f"Error loading {yaml_path}: {e}"

        try:
            scaffold_content = scaffold_path.read_text(encoding='utf-8')
        except Exception:
            scaffold_content = "# Scaffold not found - implement DAG steps manually."

        return (f"=== PYTHON STATE MACHINE SCAFFOLD ===\n"
                f"IMPORTANT: You MUST use the exact scaffold below to run the framework steps.\n\n"
                f"{scaffold_content}\n\n"
                f"=== FRAMEWORK YAML PIPELINE DAG ===\n"
                f"IMPORTANT: Execute the scaffold mapped strictly to these steps:\n\n"
                f"{yaml_content}")


if __name__ == "__main__":
    port = os.environ.get("PORT")
    if port:
        # Railway / cloud deployment: run SSE transport over HTTP
        mcp.run(transport="sse", host="0.0.0.0", port=int(port))
    else:
        # Local: run stdio transport (Claude Desktop, Cursor)
        mcp.run()
