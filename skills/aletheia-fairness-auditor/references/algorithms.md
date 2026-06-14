# Aletheia Algorithms Summary

Aletheia's `auditor` MCP provides 13 statistical and causal fairness algorithms. They are categorized into two types:

1. **PURE**: A single mathematical/statistical formula. Provided as a `knowledge.md` file containing pseudocode, math bounds, and tuning parameters. You must translate this into a Python script.
2. **FRAMEWORK**: A multi-step orchestrated DAG pipeline. Provided as a `framework.yaml` file. You must execute this using the provided `framework_scaffold.py` state machine.

## PURE Algorithms

| ID | Name | Sector Focus |
|----|------|--------------|
| `disparate_impact_repair` | Disparate Impact (80% Rule) | Hiring, Finance, Criminal Justice |
| `equality_of_opportunity` | Equality of Opportunity | Hiring, Finance, Criminal Justice |
| `recidivism_fairness_calibration` | Recidivism Calibration | Criminal Justice |
| `brownian_distance_covariance` | Brownian Distance Covariance | Hiring, Finance, Healthcare, Education |
| `causal_fair_inference` | Causal Fair Inference (PSE) | Hiring, Finance, Education |
| `causal_explanation_formula` | Causal Explanation Formula | Hiring, Finance, Education |

## FRAMEWORK Algorithms

| ID | Name | Sector Focus |
|----|------|--------------|
| `intersectional_subgroup_scan` | Intersectional Subgroup Scan | Hiring, Finance, Healthcare, Criminal Justice, Education |
| `mutual_info_proxy_scanner` | Mutual Information Scanner | Hiring, Finance, Healthcare, Education |
| `shap_proxy_detection` | SHAP Feature Attribution | Hiring, Finance, Healthcare, Education |
| `counterfactual_orthogonalization`| Counterfactual Fairness (OB) | Hiring, Finance, Education |
| `fairness_feedback_reparation` | Fairness Feedback Loops | Hiring, Finance, Education |
| `dro_fairness_no_demographics` | DRO Fairness (No Demographics) | Finance, Healthcare, Education |
| `relational_fairness_psl` | Relational Fairness (FairPSL) | Hiring, Finance, Education |

## Accessing Algorithm Knowledge

To access the deep implementation details of any algorithm, query the `auditor` MCP:

```python
# List all algorithms
call_tool("mcp__auditor__list_algorithms", {})

# Load knowledge for a specific algorithm
call_tool("mcp__auditor__load_algorithm_knowledge", {"algorithm_id": "disparate_impact_repair"})
```
