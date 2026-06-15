<div align="center">

<img src="https://img.shields.io/badge/ALETHEIA-Algorithm%20Reference-BB9AF7?style=for-the-badge&logoColor=white"/>

# 🔬 The 13-Algorithm MCP Server
## Knowledge Skill Delivery — Complete Reference

[![13 Algorithms](https://img.shields.io/badge/Algorithms-13%20Peer--Reviewed-BB9AF7?style=flat-square)](.)
[![No Libraries](https://img.shields.io/badge/Dependencies-Zero%20External%20Libraries-9ece6a?style=flat-square)](.)
[![Runtime Selection](https://img.shields.io/badge/Selection-Runtime%20Reasoning-f7768e?style=flat-square)](.)
[![MCP Protocol](https://img.shields.io/badge/Protocol-Model%20Context%20Protocol-7aa2f7?style=flat-square)](.)

← [Back to Main README](../README.md)

</div>

---

## What Is the Audit Algorithm MCP?

The **Audit Algorithm MCP Server** is a custom-built [Model Context Protocol](https://modelcontextprotocol.io) server that acts as a living library of fairness algorithm knowledge. It is the core innovation that makes Aletheia fundamentally different from every existing fairness tool.

### The Problem It Solves

Every existing fairness library (IBM AIF360, Microsoft Fairlearn, Aequitas) hardcodes specific algorithms and applies them uniformly. There is no reasoning about whether a given algorithm is appropriate for a given domain or data structure.

**Aletheia's approach:**

```
Traditional tools:                Aletheia:
  data → algorithm → result         data → reason → select algorithm
                                         → load specification
                                         → implement from spec
                                         → result + audit trail
```

### The Knowledge Skill Delivery Model

```
                    ┌──────────────────────────────────┐
                    │     AUDIT ALGORITHM MCP SERVER    │
                    │                                   │
                    │  ┌─────────────────────────────┐  │
                    │  │  Algorithm Registry         │  │
                    │  │  13 knowledge documents     │  │
                    │  │  Each contains:             │  │
                    │  │  - Plain English description│  │
                    │  │  - Mathematical derivation  │  │
                    │  │  - Runnable pseudocode       │  │
                    │  │  - best_suited_for fields   │  │
                    │  │  - not_suited_for fields    │  │
                    │  │  - Domain tags              │  │
                    │  └─────────────────────────────┘  │
                    └──────────────────────────────────┘
                                    │
                    Agent calls:    │
                    ┌───────────────▼───────────────┐
                    │  list_algorithms()             │
                    │  → returns all 13 IDs          │
                    │                                │
                    │  get_algorithm_info(id)        │
                    │  → returns description,        │
                    │    best_suited_for,            │
                    │    not_suited_for              │
                    │                                │
                    │  load_algorithm_knowledge(id)  │
                    │  → returns full math spec      │
                    │    + runnable pseudocode        │
                    └────────────────────────────────┘
```

### Why No External Libraries?

When an agent calls `load_algorithm_knowledge("equality_of_opportunity")`, it receives a complete mathematical specification — the formulas, the implementation steps, the edge cases. The agent implements this from scratch in Python inside the Docker sandbox.

**This means:**
- No dependency on `fairlearn`, `aif360`, `themis-ml`, or any fairness library
- The implementation is transparent — you can see exactly what code the agent wrote
- Any algorithm can be updated by editing one knowledge document
- New algorithms can be added without touching agent code
- Every decision is logged and reproducible

---

## How Agents Select Algorithms

### The Elimination Log

Before any algorithm is used, the agent must produce a written elimination log:

```python
algorithm_reasoning = [
    {
        "algorithm_id": "equality_of_opportunity",
        "verdict": "SELECTED_MITIGATION",
        "reason": "best_suited_for lists hiring and education domains explicitly. "
                  "Ground truth column 'hired' available so TPR equalization is "
                  "computable. not_suited_for does not include this domain."
    },
    {
        "algorithm_id": "recidivism_fairness_calibration",
        "verdict": "REJECTED",
        "reason": "not_suited_for states: not appropriate outside criminal justice "
                  "domain with known base rate impossibility. No signals matching "
                  "criminal justice in column names (arrest, recidiv, prison, etc.)"
    },
    {
        "algorithm_id": "disparate_impact_repair",
        "verdict": "REJECTED",
        "reason": "best_suited_for states: most appropriate when ground truth labels "
                  "are unavailable. Ground truth 'hired' column is present — "
                  "equality_of_opportunity is strictly more informative."
    }
]
```

This log is saved to `algorithm_selection.json` / `model_algorithm_selection.json` and available in your output files.

### Verdict Types

| Verdict | Meaning | Max Count |
|---------|---------|-----------|
| `SELECTED_MITIGATION` | Will fix the bias | Exactly 1 required |
| `SELECTED_PROXY` | Will detect proxy features | Exactly 1 |
| `SELECTED_INTERSECTIONAL` | Will scan group intersections | 0 or 1 |
| `ALWAYS_INCLUDE` | Always runs (shap_proxy_detection for models) | 1 |
| `REJECTED` | Considered but not appropriate — reason documented | Any |

---

## The 13 Algorithms

---

### Category 1 — Detection Algorithms

*Find hidden bias that surface-level analysis misses.*

---

#### 🔍 Intersectional Subgroup Scanner
**`intersectional_subgroup_scan`**

**What it does in plain English:**
Checks for bias that only appears when demographic characteristics are combined. A hiring model might treat women fairly, treat young people fairly, but specifically discriminate against young women. This pattern is invisible to any single-attribute analysis but detected by intersectional scanning.

**The technical approach:**
Generates all combinations of protected attribute values — every race × gender × age group combination that has at least 20 members in the sample. For each subgroup, computes the relevant fairness metric (approval rate, FPR, or prediction value) and compares against the overall population. Flags any subgroup where the disparity exceeds 20% relative to the best-performing subgroup.

**Best suited for:** Any audit where two or more protected attributes exist.

**Not suited for:** Datasets with very small groups where subgroup combinations have fewer than 20 members.

**Why no external library:** The scanning combinatorics and fairness gerrymandering detection are implemented from the specification's pseudocode.

---

#### 🔍 Mutual Information Proxy Scanner
**`mutual_info_proxy_scanner`**

**What it does in plain English:**
Finds features that secretly carry demographic information, even when the relationship isn't a straight line. Where standard Pearson correlation only finds linear relationships (taller people weigh more), mutual information finds any relationship — including complex ones like "people who live in certain postcodes are disproportionately from certain ethnic groups."

**The technical approach:**
Computes Shannon mutual information I(X; P) between each feature X and the protected attribute P. Unlike Pearson r which measures linear correlation, MI captures any statistical dependence:
```
I(X; P) = Σ p(x,p) · log(p(x,p) / (p(x) · p(p)))
```
Features with MI above the threshold are flagged as proxy risks.

**Best suited for:** Any sample size. Efficient O(N log N) computation.

**Not suited for:** Nothing — this is the default proxy scanner for all but small datasets where distance covariance is more powerful.

**When selected:** Always selected when sample size > 5,000 rows (where brownian_distance_covariance becomes computationally prohibitive at O(N²)).

---

#### 🔍 Brownian Distance Covariance Scanner
**`brownian_distance_covariance`**

**What it does in plain English:**
A more powerful proxy detector that catches complex U-shaped or non-monotonic relationships that even mutual information can miss. Imagine income vs age — very young people and very old people might both be underrepresented in a hiring dataset, creating a U-shape. Standard correlation says "near zero." Distance covariance says "strongly dependent."

**The technical approach:**
Computes pairwise Euclidean distance matrices for both the feature and the protected attribute, then measures the correlation between those distance matrices:
```
dCov²(X,P) = E[A·B] - 2E[A·E[B|P]] + E[A]E[B]
```
where A and B are double-centered distance matrices. A dCov of zero means statistical independence regardless of relationship shape.

**Best suited for:** Small to medium datasets (up to ~5,000 rows) where the O(N²) computation is feasible.

**Not suited for:** Large datasets — the pairwise distance matrix computation becomes prohibitively slow above 5,000 rows.

**When selected:** When sample size ≤ 5,000 rows (more powerful than MI for this range).

---

#### 🔍 SHAP Proxy Detector
**`shap_proxy_detection`**

**What it does in plain English:**
Uses game theory to calculate exactly how much each feature contributed to each individual prediction, then checks whether the features that most influence predictions also correlate with protected attributes. If "postcode" has high SHAP importance AND high correlation with race, the model is using postcode as a proxy for race in a legally and ethically significant way.

**The technical approach:**
Based on Shapley values from cooperative game theory. Each feature's contribution to a prediction is its marginal contribution averaged across all possible feature orderings. For each of the top-N SHAP-important features, computes Pearson r with the protected attribute. Features with both high SHAP rank (top 10) and |r| > 0.25 are identified as active proxy discriminators.

**Best suited for:** Model auditing where SHAP values are available. Always included for model pipeline.

**Not suited for:** Dataset-only auditing where no model exists to compute SHAP values.

**Always included for:** Classification and regression model pipelines regardless of other algorithm selections.

---

### Category 2 — Mitigation Algorithms

*Fix the detected bias.*

---

#### 🔧 Disparate Impact Repair
**`disparate_impact_repair`**

**What it does in plain English:**
Adjusts the dataset or model outputs so that different demographic groups receive approximately equal positive outcomes — the 80% rule. Does not require knowing who was actually qualified; works purely on prediction distributions.

**The technical approach:**
For datasets: Reweighs samples from underrepresented groups and over-represents samples from privileged groups to equalize the marginal distributions, then retrains a fair model on the reweighted data.

For models without ground truth: Finds per-group decision thresholds that equalize approval rates across groups, using the overall approval rate as the equalisation target.

**Best suited for:** When ground truth labels are unavailable. Lending decisions where actual creditworthiness is unknown. Any domain where historical outcomes themselves are contaminated by past discrimination.

**Not suited for:** When ground truth labels ARE available — equality_of_opportunity uses more information and is strictly superior in that case.

**Accuracy trade-off:** Typically 1-5% overall accuracy reduction. Explicitly documented in the report.

---

#### 🔧 Equal Opportunity Calibrator
**`equality_of_opportunity`**

**What it does in plain English:**
Ensures that equally qualified people — those who actually should be approved, hired, or admitted — get equal chances regardless of their demographic group. Adjusts the decision threshold per group on the ROC curve to equalise true positive rates.

**The technical approach:**
For each protected group, plots the full ROC curve (TPR vs FPR at every possible threshold). Finds the threshold per group that achieves the target TPR (usually the mean TPR at 0.50 across all groups). Applies group-specific thresholds at inference time.

Mathematically: find t_g for each group g such that:
```
TPR_g(t_g) = mean_k(TPR_k(0.50))  for all k
```

**Best suited for:** Hiring (equally qualified candidates), education (equally capable students), lending (equally creditworthy borrowers). Requires ground truth labels.

**Not suited for:** Criminal justice where equal opportunity (TPR equalization) has different implications than error rate equalization. Not suited when ground truth labels are unavailable.

**Accuracy trade-off:** Typically 1-4% overall accuracy reduction. Explicitly documented.

---

#### 🔧 Recidivism Fairness Calibrator
**`recidivism_fairness_calibration`**

**What it does in plain English:**
Handles the mathematical impossibility theorem that applies specifically to criminal justice risk scoring. When two racial groups have genuinely different base rates of reoffending (due to historical systemic factors), it is mathematically impossible to simultaneously achieve: equal false positive rates AND equal positive predictive value. This algorithm applies a cost-calibrated tradeoff that minimises the most harmful errors (wrongly incarcerating innocent people) while being transparent about which fairness metrics cannot be simultaneously satisfied.

**The technical approach:**
Implements the Kleinberg-Mullainathan-Raghavan impossibility theorem verification: checks whether base rates differ significantly between groups. If they do, documents the mathematical constraint. Applies FPR equalisation as the primary target (reducing wrongful high-risk labels), using a cost matrix where FP errors are weighted more heavily than FN errors.

**Best suited for:** Criminal justice risk scoring, recidivism prediction, parole decisions, pretrial detention scoring (COMPAS-style).

**Not suited for:** Any domain other than criminal justice where the base rate impossibility theorem does not apply with the same ethical weight.

**When selected:** Automatically when criminal justice domain signals are detected in column names (recidiv, arrest, jail, prison, compas, charge, etc.).

---

### Category 3 — Causal Algorithms

*Understand exactly why bias exists and what drives it.*

---

#### 🧬 Causal Fair Inference
**`causal_fair_inference`**

**What it does in plain English:**
Separates the discrimination that flows directly from protected attributes (someone was rejected because they are female) from discrimination that flows through proxy features (someone was rejected because of their postcode, which is correlated with race). This decomposition is crucial for targeted remediation — you cannot fix indirect discrimination with threshold calibration alone.

**The technical approach:**
Uses Inverse Probability Weighting (IPW) to estimate path-specific effects. Builds a causal graph where the protected attribute P causes the outcome Y both directly (P → Y) and indirectly through proxy features M (P → M → Y). IPW reweights observations to remove the confounding effect of M, isolating the direct path:

```
Direct Effect  = E[Y | do(P=p1)] - E[Y | do(P=p0)]
               (holding M constant)

Indirect Effect = Total Effect - Direct Effect
```

**Best suited for:** Regression models (salary prediction, credit scoring), any situation where you need to distinguish direct from indirect discrimination for legal or policy purposes.

**Not suited for:** When a causal graph cannot be reasonably specified, or when sample size is too small for IPW estimation to be stable.

---

#### 🧬 Counterfactual Fairness Transform
**`counterfactual_orthogonalization`**

**What it does in plain English:**
Mathematically transforms the features so that for any individual, their counterfactual self — identical in every way except for a different protected attribute value — would receive the same prediction. Uses linear algebra (SVD) to project features into a space where they are orthogonal (uncorrelated) to the protected attribute.

**The technical approach:**
Applies Singular Value Decomposition to decompose the feature matrix X into components that correlate with the protected attribute P and components that do not. Removes the correlated component:
```
X_fair = X - X_P · (X_P^T X_P)^{-1} X_P^T X
```
where X_P is the projection of X onto P. The result is a feature matrix where no feature carries demographic information.

**Best suited for:** Pre-processing before retraining. Situations where full counterfactual fairness is a hard requirement.

**Not suited for:** Post-hoc fixes to deployed models. Requires retraining on transformed features to take effect.

---

#### 🧬 Causal Explanation Formula
**`causal_explanation_formula`**

**What it does in plain English:**
Provides a mathematical breakdown of where the total discrimination gap comes from — how much is attributable to direct discrimination, how much to indirect discrimination through specific proxy features, and how much is spurious correlation. This is the audit trail a legal team needs to defend against a discrimination claim or justify a remediation strategy.

**The technical approach:**
Decomposes the total effect TE into three components following the Pearl-Robins-Richardson causal decomposition:

```
Total Effect    = Direct Effect + Indirect Effect + Spurious Effect
TE(P → Y)       = DE(P → Y)  + IE(P → M → Y) + SE(confounders)
```

Each component is estimated from the data using do-calculus and backdoor adjustment.

**Best suited for:** Legal analysis, policy design, narrowly tailored remediation where you need to address only the direct discrimination without eliminating legitimate feature contributions.

**Not suited for:** Simple detection tasks where knowing that bias exists is sufficient.

---

### Category 4 — Structural Algorithms

*Specialist cases that standard fairness methods miss entirely.*

---

#### 🏗️ Fairness Feedback Reparation
**`fairness_feedback_reparation`**

**What it does in plain English:**
Detects how bias compounds over time when a biased model generates decisions that then become training data for the next model generation. If an AI system rejects qualified candidates from minority groups, those people never appear in the "successful employee" training data, making the next model more biased. This is the feedback loop problem, and it makes bias self-reinforcing and exponentially worsening over time.

**The technical approach:**
Models the Markov chain of model generations where the outcome distribution of generation t becomes the training data distribution for generation t+1. Computes the stationary distribution and checks whether it converges to demographic erasure of minority groups. Applies STAR quota constraints to break the feedback loop and ensure representation at each generation.

**Best suited for:** AI systems with feedback loops (recommendation systems, hiring pipelines where past hires affect future training, credit systems where past decisions affect future creditworthiness data).

**Not suited for:** One-shot predictions with no feedback mechanism.

---

#### 🏗️ Fairness Without Demographics
**`dro_fairness_no_demographics`**

**What it does in plain English:**
Audits and corrects for bias even when demographic labels are not present in the data. Uses Distributionally Robust Optimization to find the worst-performing subgroup in the data and optimises for that group's performance, ensuring that no group is systematically abandoned regardless of whether we know which group it is.

**The technical approach:**
Solves the minimax problem:
```
min_θ max_{P ∈ P_ε} E_P[loss(θ, X, Y)]
```
where P_ε is the set of all distributions within ε-distance (in terms of χ² divergence) from the empirical distribution. This is equivalent to optimising for the worst-case subgroup without needing to know which subgroup it is.

**Best suited for:** Healthcare datasets where demographic labels are legally restricted. Any dataset where demographic information was not collected. Privacy-preserving audit scenarios.

**Not suited for:** Situations where specific group-level disparities need to be measured and reported — DRO provides worst-case guarantees but not group-specific metrics.

---

#### 🏗️ Relational Fairness (PSL)
**`relational_fairness_psl`**

**What it does in plain English:**
Detects bias in networked or relational data — situations where the people making decisions and the people receiving decisions are connected, and where decisions about one person affect the outcomes available to connected people. Standard fairness metrics assume every individual is independent. In reality, in a hiring pipeline, if all the referred candidates come from one demographic network, the AI's recommendations will systematically reflect that network's demographics.

**The technical approach:**
Uses Probabilistic Soft Logic (PSL) to encode fairness constraints as first-order logic rules over the relationship graph:
```
similar_qualifications(A, B) ∧ connected(A, B) → ~fair_disparity(A, B)
```
Inference over the relational model produces soft-constraint violation scores for each node, identifying structural sources of discrimination in the network topology.

**Best suited for:** Social network referral hiring, credit decisions in communities with strong social ties, recommendation systems in social platforms, any domain with explicit relational structure.

**Not suited for:** Standard i.i.d. tabular data with no relational structure between records.

---

## Adding New Algorithms

The MCP server is extensible. To add a new algorithm:

1. Create a new knowledge document in `mcps/auditor/knowledge/`
2. Follow the existing format:
   ```markdown
   # Algorithm Name
   **ID:** algorithm_id
   **Type:** detection | mitigation | causal | structural
   **best_suited_for:** [domain, domain, condition]
   **not_suited_for:** [domain, condition]

   ## Mathematical Specification
   [formulas]

   ## Implementation
   [pseudocode]
   ```
3. Register it in `mcps/auditor/server.py`
4. It becomes available to all agents at next server start — no agent code changes required.

---

## Algorithm Selection Decision Tree (Reference)

```
Is domain criminal justice?
  YES → recidivism_fairness_calibration
  NO  ↓

Is ground truth available?
  NO  → disparate_impact_repair
  YES ↓

Is the domain hiring, education, or general?
  YES → equality_of_opportunity
  
Is it a regression model?
  YES → causal_fair_inference (preferred) or disparate_impact_repair

Sample size > 5000 rows?
  YES → mutual_info_proxy_scanner (for proxy detection)
  NO  → brownian_distance_covariance (more powerful for small-medium)

Multiple protected attributes?
  YES → add intersectional_subgroup_scan

Is it a model audit?
  YES → always add shap_proxy_detection

No demographic labels?
  YES → dro_fairness_no_demographics

Has feedback loop or relational structure?
  YES → fairness_feedback_reparation or relational_fairness_psl
```

---

<div align="center">

← [Back to Main README](README.md) · [Dataset Agents →](DATASET_AGENTS.md) · [Model Agents →](MODEL_AGENTS.md) · [Privacy →](Privacy.md)

**Aletheia AI ·**

</div>
