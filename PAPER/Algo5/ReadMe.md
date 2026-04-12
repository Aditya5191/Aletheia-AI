# Mutual Information Proxy Scanner & Mitigator

## Title
Information-Theoretic Proxy Detection & Conditional Decorrelation for Algorithmic Fairness

## Overview
This implementation provides a rigorous, information-theoretic framework for detecting and mitigating proxy discrimination in machine learning datasets. By leveraging Mutual Information (MI) estimation with permutation testing and FDR control, the toolkit identifies features that indirectly encode protected attributes. It then applies conditional residualization to remove proxy leakage while preserving predictive utility. The pipeline is model-agnostic, statistically grounded, and designed for regulatory compliance and fairness auditing.

## Problem Being Solved
Excluding sensitive attributes from training data fails to ensure fairness due to proxy variables that correlate with protected groups through historical, social, or structural pathways. Traditional correlation metrics miss non-linear dependencies, and manual proxy identification is infeasible at scale. This library addresses the need for automated, statistically robust proxy scanning and targeted mitigation that works across continuous, categorical, and mixed-type features.

## Sector Suitability Analysis

### Hiring & HR
**Suitability**: HIGHLY SUITABLE  
**Justification**: 
- *Type of data required*: Applicant features (education, zip code, test scores, work history)
- *Bias type handled*: Algorithmic bias via proxy discrimination; captures non-linear encoding of race/gender in features like university prestige or commute distance
- *Mediators involved*: ATS platforms, HR screening tools; preprocessing integrates seamlessly before model training
- *Note*: Residualization preserves ranking/ordering critical for candidate scoring

### Lending & Finance
**Suitability**: SUITABLE WITH CAUTION  
**Justification**:
- *Type of data required*: Credit history, income, transaction patterns, geographic indicators
- *Bias type handled*: Redlining proxies (ZIP code, bank branch proximity) and behavioral signals correlated with protected classes
- *Mediators involved*: Credit scoring engines, underwriting pipelines; decorrelation aligns with fair lending compliance audits
- *Note*: Must validate that residualized features retain default-predictive power; regulatory documentation required

### Healthcare
**Suitability**: MODERATELY SUITABLE  
**Justification**:
- *Type of data required*: Clinical measurements, utilization history, socioeconomic indicators
- *Bias type handled*: Proxy bias in diagnostic or treatment recommendation models (e.g., insurance type as race proxy)
- *Mediators involved*: Clinical decision support, EHR analytics; preprocessing requires clinical validation to avoid removing legitimate biomarkers
- *Note*: Causal confounding may require domain-specific override; residualization should not strip prognostically relevant signals

### Criminal Justice
**Suitability**: CONDITIONALLY SUITABLE  
**Justification**:
- *Type of data required*: Prior arrests, charge severity, employment status, geographic features
- *Bias type handled*: Algorithmic bias via policing proxies (arrest frequency, neighborhood density) encoding race/class
- *Mediators involved*: Risk assessment tools, pretrial systems; proxy removal supports equitable risk scoring
- *Note*: Ground truth labels often biased; proxy removal mitigates amplification but cannot fix fundamentally flawed outcome data

### Education
**Suitability**: SUITABLE  
**Justification**:
- *Type of data required*: Test scores, attendance, socioeconomic status, school district indicators
- *Bias type handled*: Proxy discrimination in admissions or resource allocation (e.g., school funding level as race proxy)
- *Mediators involved*: Admissions pipelines, equity monitoring systems; preprocessing supports transparent feature auditing
- *Note*: Preserves merit-based signals while stripping systemic inequity encoding

### Summary Assessment
| Domain | Suitability | Primary Reason |
|--------|-------------|---------------|
| Hiring & HR | ★★★★★ | Clear proxy pathways; regulatory alignment; preserves ranking utility |
| Lending & Finance | ★★★★☆ | Strong compliance fit; geographic/behavioral proxies common; requires utility validation |
| Education | ★★★★☆ | Transparent feature auditing; supports equity initiatives |
| Healthcare | ★★★☆☆ | Clinical signal preservation critical; requires domain oversight |
| Criminal Justice | ★★☆☆☆ | Label validity concerns; proxies reflect systemic bias; needs policy alignment |

**Best Suited Domain(s)**: Hiring & HR, Lending & Finance, Education  
**Least Suitable Domain(s)**: Criminal Justice, Healthcare (without domain-specific validation & causal review)  
**Reasoning**: Domains with structured feature spaces, clear proxy pathways, and institutional capacity for preprocessing validation benefit most. Domains where labels reflect systemic bias or where feature-target causality is complex require careful clinical/legal oversight before proxy removal.

## Bias Coverage Analysis

| Bias Type               | Addressed?    | Explanation                                                                                                                                               |
| ----------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Statistical Bias**    | Yes           | Directly quantifies statistical dependence between features and protected attributes using information theory                                             |
| **Historical Bias**     | Indirectly    | Proxies often encode historical inequalities; removing them mitigates downstream propagation                                                              |
| **Representation Bias** | Partially     | Does not fix sampling imbalances, but prevents underrepresented groups from being inferred via proxies                                                    |
| **Measurement Bias**    | Conditionally | Assumes features are accurately measured; measurement error correlated with A inflates MI estimates                                                       |
| **Algorithmic Bias**    | Yes (Primary) | Core contribution: identifies and removes proxy-driven discriminatory learning pathways                                                                   |
| **Evaluation Bias**     | Yes           | Shifts evaluation from marginal parity to information-theoretic leakage assessment, preventing hidden proxy exploitation                                  |

## Features
- Robust k-NN and histogram-based Mutual Information estimation
- Permutation testing with Benjamini-Hochberg FDR control
- Automated proxy flagging with configurable significance/magnitude thresholds
- Conditional residualization mitigation (linear & non-linear predictors)
- Scale-preserving transformations for downstream compatibility
- Comprehensive reporting with MI scores, p-values, and variance retention metrics
- Model-agnostic preprocessing compatible with any ML pipeline

## How the Algorithm Works
1. **MI Estimation**: Compute pairwise Mutual Information between each feature and protected attribute using k-NN estimator
2. **Significance Testing**: Generate null distribution via attribute permutation; calculate empirical p-values
3. **FDR Control**: Apply Benjamini-Hochberg correction; flag features exceeding adjusted p-value and MI thresholds
4. **Proxy Residualization**: For each flagged feature, predict from protected attribute using flexible regressor
5. **Signal Preservation**: Replace original feature with residual; restore scale to maintain downstream compatibility
6. **Output**: Cleaned dataset with proxy leakage removed, plus transformation metadata for audit trails

## Installation
```bash
pip install numpy pandas scikit-learn scipy
git clone https://github.com/yourorg/mi-proxy-scanner.git
cd mi-proxy-scanner