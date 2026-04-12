# SHAP Proxy Detection & Redundancy Auditor

## Title
Axiomatic Feature Attribution for Proxy Discrimination Detection & Mitigation

## Overview
This implementation provides a rigorous, SHAP-based framework for detecting proxy discrimination and feature redundancy in machine learning models. By leveraging Shapley value theory and the Kernel SHAP approximation, the toolkit quantifies exact feature contributions to predictions, identifies hidden proxy pathways, and offers configurable mitigation strategies to reduce discriminatory reliance. The pipeline is model-agnostic, axiomatically consistent, and designed for fairness auditing and compliance documentation.

## Problem Being Solved
Black-box models frequently achieve high accuracy by exploiting proxy features that indirectly encode protected attributes (e.g., geographic indicators, transaction patterns). Traditional correlation-based audits miss non-linear proxy pathways and redundant feature sets. This library addresses the need for theoretically sound, interpretable attribution metrics that precisely quantify feature importance, detect proxy leakage, and enable targeted mitigation without global model retraining or heuristic thresholds.

## Sector Suitability Analysis

### Hiring & HR
**Suitability**: HIGHLY SUITABLE  
**Justification**: 
- *Type of data required*: Candidate assessments, education history, work experience, demographic indicators
- *Bias type handled*: Algorithmic bias via proxy features (e.g., university prestige, commute distance encoding socioeconomic status)
- *Mediators involved*: ATS platforms, HR screening tools; SHAP reports integrate directly into compliance audits
- *Note*: Residualization preserves ranking properties critical for candidate scoring while stripping proxy signals

### Lending & Finance
**Suitability**: SUITABLE WITH CAUTION  
**Justification**:
- *Type of data required*: Credit history, income stability, transaction patterns, geographic indicators
- *Bias type handled*: Redlining proxies and behavioral signals encoding protected classes through complex pathways
- *Mediators involved*: Underwriting engines, risk modeling pipelines; attribution aligns with fair lending model validation
- *Note*: Must validate residualized features retain default-predictive power; regulatory documentation required for proxy removal rationale

### Healthcare
**Suitability**: MODERATELY SUITABLE  
**Justification**:
- *Type of data required*: Clinical measurements, utilization history, socioeconomic indicators, genetic markers
- *Bias type handled*: Proxy bias in diagnostic models (e.g., insurance tier or neighborhood density non-linearly encoding race/SES)
- *Mediators involved*: Clinical decision support, EHR analytics; preprocessing requires clinical validation to avoid removing legitimate biomarkers
- *Note*: Causal confounding may require domain-specific override; residualization should not strip prognostically relevant signals

### Criminal Justice
**Suitability**: CONDITIONALLY SUITABLE  
**Justification**:
- *Type of data required*: Prior record, charge severity, employment status, geographic features
- *Bias type handled*: Algorithmic bias via policing proxies (arrest frequency, neighborhood density) encoding race/class
- *Mediators involved*: Risk assessment tools, pretrial systems; proxy removal supports equitable risk scoring
- *Note*: Label validity concerns may distort dependence assessment; mitigation requires explicit policy justification and stakeholder consensus

### Education
**Suitability**: SUITABLE  
**Justification**:
- *Type of data required*: Test scores, attendance, socioeconomic status, school district indicators
- *Bias type handled*: Proxy discrimination in admissions or resource allocation (e.g., school funding level encoding race)
- *Mediators involved*: Admissions pipelines, equity monitoring systems; preprocessing supports transparent feature auditing
- *Note*: Preserves merit-based signals while stripping systemic inequity encoding through complex pathways

### Summary Assessment
| Domain | Suitability | Primary Reason |
|--------|-------------|---------------|
| Hiring & HR | ★★★★★ | Clear proxy pathways; regulatory alignment; preserves ranking utility |
| Lending & Finance | ★★★★☆ | Strong compliance fit; complex behavioral proxies common; requires utility validation |
| Education | ★★★★☆ | Transparent feature auditing; supports equity initiatives |
| Healthcare | ★★★☆☆ | Clinical signal preservation critical; requires domain oversight |
| Criminal Justice | ★★☆☆☆ | Label validity concerns; proxies reflect systemic bias; needs policy alignment |

**Best Suited Domain(s)**: Hiring & HR, Lending & Finance, Education  
**Least Suitable Domain(s)**: Criminal Justice, Healthcare (without domain-specific validation & causal review)  
**Reasoning**: Domains with structured feature spaces, clear proxy pathways, and institutional capacity for preprocessing validation benefit most. Domains where labels reflect systemic bias or where feature-target causality is complex require careful clinical/legal oversight before proxy removal.

## Bias Coverage Analysis

| Bias Type               | Addressed?    | Explanation                                                                                                                                               |
| ----------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Statistical Bias**    | Yes           | Quantifies statistical dependence of predictions on specific features; detects skewed attribution distributions across groups                               |
| **Historical Bias**     | Indirectly    | Identifies features encoding historical discrimination patterns; enables targeted removal or downweighting                                                  |
| **Representation Bias** | Partially     | Detects unequal feature importance across subgroups; does not directly fix sampling imbalances                                                            |
| **Measurement Bias**    | Conditionally | Relies on accurate feature values; measurement error propagates through SHAP marginal calculations                                                        |
| **Algorithmic Bias**    | Yes (Primary) | Core contribution: exposes proxy discrimination and redundant encoding by quantifying exact feature contributions to predictions                            |
| **Evaluation Bias**     | Yes           | Shifts evaluation from black-box accuracy to transparent attribution auditing; prevents hidden proxy exploitation                                          |

## Features
- Axiomatic SHAP value computation via Kernel SHAP approximation
- Proxy risk scoring combining SHAP magnitude and protected attribute correlation
- Redundancy detection via pairwise SHAP correlation analysis
- Configurable mitigation: feature removal, residualization, or sample reweighting
- Variance retention checks to preserve predictive utility
- Comprehensive reporting with attribution rankings, proxy flags, and mitigation metadata
- Model-agnostic auditing compatible with any sklearn-compatible estimator

## How the Algorithm Works
1. **Baseline Computation**: Calculate expected model output using feature means
2. **Subset Sampling**: Generate binary presence/absence vectors weighted by Shapley kernel
3. **Conditional Expectation**: Approximate model outputs for masked feature subsets
4. **SHAP Regression**: Solve weighted linear regression to obtain exact feature attributions
5. **Proxy Scoring**: Multiply SHAP importance by protected attribute correlation magnitude
6. **Flagging**: Identify features exceeding proxy/redundancy thresholds
7. **Mitigation Application**: Remove, residualize, or reweight proxy features based on SHAP scores
8. **Validation**: Recompute attributions on mitigated data to verify proxy signal reduction

## Installation
```bash
pip install numpy pandas scikit-learn scipy
git clone https://github.com/yourorg/shap-proxy-auditor.git
cd shap-proxy-auditor