# Causal Fair Inference & Path-Specific Effect Mitigation

## Title
Fair Inference on Outcomes: Constrained Maximum Likelihood for Path-Specific Discrimination

## Overview
This implementation provides a causal inference framework for detecting and mitigating algorithmic discrimination by targeting disallowed causal pathways. Grounded in the methodology of Nabi & Shpitser (2018), the toolkit estimates path-specific effects (PSEs) using robust causal estimators, then enforces fairness through constrained maximum likelihood optimization. It includes a principled out-of-sample prediction protocol that marginalizes new instances over the constrained "fair world," ensuring statistical validity and utility preservation.

## Problem Being Solved
Associative fairness metrics fail to distinguish between legitimate mediators and discriminatory pathways, leading to counter-intuitive or legally misaligned conclusions. Existing causal fairness methods lack proper finite-sample inference, mishandle non-identifiable effects, or fail to correctly predict on new data drawn from unfair distributions. This library addresses the need for a statistically rigorous, optimization-based framework that bounds discriminatory path-specific effects while maximizing predictive utility and correctly handling out-of-sample instances.

## Sector Suitability Analysis

### Hiring & HR
**Suitability**: HIGHLY SUITABLE  
**Justification**: 
- *Type of data required*: Applicant features (education, experience, skills), demographic attributes, hiring outcomes
- *Bias type handled*: Algorithmic bias via direct discriminatory pathways (e.g., gender directly influencing interview scores while holding skills constant)
- *Mediators involved*: Job-relevant mediators (test scores, years of experience) align with legal disparate treatment doctrine
- *Note*: Causal graphs are typically well-understood; constrained optimization maps to legally defensible hiring criteria

### Lending & Finance
**Suitability**: SUITABLE  
**Justification**:
- *Type of data required*: Credit history, income, debt ratios, protected attributes, default outcomes
- *Bias type handled*: Direct redlining pathways vs legitimate financial mediators (income, payment history)
- *Mediators involved*: Clear separation between discriminatory proxies and legitimate risk factors
- *Note*: Requires careful causal graph specification to comply with ECOA/Fair Lending regulations; constrained models support audit trails

### Healthcare
**Suitability**: MODERATELY SUITABLE  
**Justification**:
- *Type of data required*: Clinical biomarkers, treatment history, demographic/SES indicators, health outcomes
- *Bias type handled*: Discriminatory treatment allocation pathways vs legitimate clinical mediators
- *Mediators involved*: Access-to-care and socioeconomic mediators often confound causal paths; requires sensitivity analysis
- *Note*: Unmeasured confounding common in EHR data; label reliability varies; causal assumptions require clinical validation

### Criminal Justice
**Suitability**: CONDITIONALLY SUITABLE  
**Justification**:
- *Type of data required*: Prior records, charge severity, demographic attributes, recidivism outcomes
- *Bias type handled*: Direct discriminatory sentencing/bail pathways vs legitimate risk factors
- *Mediators involved*: Prior arrests often reflect policing bias rather than true risk, violating ignorability assumptions
- *Note*: Severe measurement bias in outcome labels; unmeasured confounding likely; requires policy-level causal review before deployment

### Education
**Suitability**: SUITABLE  
**Justification**:
- *Type of data required*: Test scores, GPA, demographic/SES data, admission/retention outcomes
- *Bias type handled*: Direct discriminatory admissions pathways vs legitimate academic mediators
- *Mediators involved*: Well-defined academic pathways; institutional review boards support causal validation
- *Note*: Clear causal structure; constrained models align with Title IX/VI compliance; supports transparent policy calibration

### Summary Assessment
| Domain | Suitability | Primary Reason |
|--------|-------------|---------------|
| Hiring & HR | ★★★★★ | Clear causal pathways; legal alignment with disparate treatment; well-defined mediators |
| Lending & Finance | ★★★★☆ | Regulatory compatibility; identifiable mediators; supports audit-ready constrained models |
| Education | ★★★★☆ | Transparent causal structure; institutional oversight; clear academic mediators |
| Healthcare | ★★★☆☆ | Unmeasured confounding common; outcome labels noisy; requires clinical validation |
| Criminal Justice | ★★☆☆☆ | Severe label bias; unmeasured confounding; violates core causal ignorability assumptions |

**Best Suited Domain(s)**: Hiring & HR, Lending & Finance, Education  
**Least Suitable Domain(s)**: Criminal Justice, Healthcare (without rigorous causal validation & sensitivity analysis)  
**Reasoning**: Domains with well-specified causal graphs, identifiable mediators, and reliable outcome labels benefit most. Domains with severe measurement bias, unmeasured confounding, or legally contested outcome definitions risk invalid PSE estimation and constrained optimization failures.

## Bias Coverage Analysis

| Bias Type               | Addressed?    | Explanation                                                                                                                                               |
| ----------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Statistical Bias**    | Yes           | Uses robust estimators (IPW, triply robust) to reduce bias in PSE estimation under model misspecification                                                 |
| **Historical Bias**     | Indirectly    | Isolates discriminatory pathways that encode historical inequities, though does not correct upstream data generation                                        |
| **Representation Bias** | Partially     | Accounts for group base rate differences via causal adjustment, but does not fix sampling imbalances                                                        |
| **Measurement Bias**    | Conditionally | Assumes accurate outcome labels; biased measurements distort PSE estimation and constrained optimization                                                    |
| **Algorithmic Bias**    | Yes (Primary) | Core contribution: targets and bounds path-specific discriminatory effects rather than marginal statistical parity                                          |
| **Evaluation Bias**     | Yes           | Shifts evaluation from associative metrics to causal pathway effects, preventing misleading fairness assessments                                            |

## Features
- Causal path-specific effect estimation (NDE, direct/indirect pathways)
- Robust IPW and mediation formula estimators with bootstrap confidence intervals
- Constrained maximum likelihood optimization for fair model training
- Out-of-sample fair prediction via marginalization over sensitive variables
- Configurable fairness bounds ($\epsilon_l, \epsilon_u$) for mean difference or odds ratio scales
- Compatibility with logistic regression, GLMs, and custom likelihood functions
- Comprehensive diagnostic reporting with PSE estimates, CIs, and constraint feasibility

## How the Algorithm Works
1. **Causal Specification**: Define treatment (sensitive attribute), mediators, confounders, and outcome
2. **PSE Estimation**: Compute path-specific effect using IPW or mediation formula with bootstrap uncertainty
3. **Fairness Assessment**: Compare estimated PSE against acceptable bounds; flag violations
4. **Constrained Optimization**: Maximize data likelihood subject to PSE bounds using SLSQP or similar solvers
5. **Out-of-Sample Protocol**: Predict new instances by averaging over sensitive variables using constrained distribution
6. **Validation**: Verify constrained model satisfies bounds while preserving predictive utility on holdout data

## Installation
```bash
pip install numpy pandas scipy scikit-learn
git clone https://github.com/yourorg/causal-fair-inference.git
cd causal-fair-inference