# Distance Correlation Proxy Scanner & Mitigator

## Title
Non-Linear Dependence Auditing & Decorrelation via Brownian Distance Covariance

## Overview
This implementation provides a rigorous, assumption-free framework for detecting and mitigating non-linear proxy discrimination in machine learning datasets. Leveraging Distance Correlation (dCor) as introduced by Székely & Rizzo (2009), the toolkit identifies features that exhibit arbitrary statistical dependence on protected attributes, regardless of linearity or distribution. It then applies targeted residualization to remove proxy leakage while preserving predictive utility. The pipeline is model-agnostic, statistically grounded, and designed for compliance auditing and fairness engineering.

## Problem Being Solved
Excluding sensitive attributes from training data fails to guarantee fairness because non-linear proxy relationships encode protected information in complex, high-dimensional feature spaces. Classical correlation metrics miss U-shaped, threshold-based, or multivariate dependencies. This library addresses the need for robust, distribution-free proxy detection and targeted mitigation that captures all dependence structures without manual feature engineering or parametric assumptions.

## Sector Suitability Analysis

### Hiring & HR
**Suitability**: HIGHLY SUITABLE  
**Justification**: 
- *Type of data required*: Candidate features (test scores, experience, education, commute distance)
- *Bias type handled*: Algorithmic bias via non-linear proxy encoding (e.g., university prestige or zip code non-linearly correlated with demographics)
- *Mediators involved*: ATS platforms, HR screening pipelines; preprocessing integrates before model training
- *Note*: Residualization preserves ranking properties critical for candidate scoring while stripping non-linear demographic leakage

### Lending & Finance
**Suitability**: SUITABLE WITH CAUTION  
**Justification**:
- *Type of data required*: Credit history, transaction patterns, income stability, geographic indicators
- *Bias type handled*: Non-linear redlining proxies and behavioral signals encoding protected classes through complex spending patterns
- *Mediators involved*: Underwriting engines, risk modeling systems; decorrelation aligns with fair lending compliance audits
- *Note*: Must validate residualized features retain default-predictive power; regulatory documentation required for proxy removal rationale

### Healthcare
**Suitability**: MODERATELY SUITABLE  
**Justification**:
- *Type of data required*: Clinical measurements, utilization history, socioeconomic indicators, genetic markers
- *Bias type handled*: Non-linear proxy bias in diagnostic models (e.g., insurance tier or neighborhood density non-linearly encoding race/SES)
- *Mediators involved*: Clinical decision support, EHR analytics; preprocessing requires clinical validation to avoid removing legitimate biomarkers
- *Note*: Causal confounding may require domain-specific override; residualization should not strip prognostically relevant signals

### Criminal Justice
**Suitability**: CONDITIONALLY SUITABLE  
**Justification**:
- *Type of data required*: Prior record, charge severity, employment status, geographic features
- *Bias type handled*: Non-linear algorithmic bias via policing proxies (arrest frequency, neighborhood density) encoding race/class
- *Mediators involved*: Risk assessment tools, pretrial systems; proxy removal supports equitable risk scoring
- *Note*: Label validity concerns may distort dependence assessment; mitigation requires explicit policy justification and stakeholder consensus

### Education
**Suitability**: SUITABLE  
**Justification**:
- *Type of data required*: Test scores, attendance, socioeconomic status, school district indicators
- *Bias type handled*: Non-linear proxy discrimination in admissions or resource allocation (e.g., school funding level non-linearly encoding race)
- *Mediators involved*: Admissions pipelines, equity monitoring systems; preprocessing supports transparent feature auditing
- *Note*: Preserves merit-based signals while stripping systemic inequity encoding through complex pathways

### Summary Assessment
| Domain | Suitability | Primary Reason |
|--------|-------------|---------------|
| Hiring & HR | ★★★★★ | Clear non-linear proxy pathways; regulatory alignment; preserves ranking utility |
| Lending & Finance | ★★★★☆ | Strong compliance fit; complex behavioral proxies common; requires utility validation |
| Education | ★★★★☆ | Transparent feature auditing; supports equity initiatives |
| Healthcare | ★★★☆☆ | Clinical signal preservation critical; requires domain oversight |
| Criminal Justice | ★★☆☆☆ | Label validity concerns; proxies reflect systemic bias; needs policy alignment |

**Best Suited Domain(s)**: Hiring & HR, Lending & Finance, Education  
**Least Suitable Domain(s)**: Criminal Justice, Healthcare (without domain-specific validation & causal review)  
**Reasoning**: Domains with structured feature spaces, clear non-linear proxy pathways, and institutional capacity for preprocessing validation benefit most. Domains where labels reflect systemic bias or where feature-target causality is complex require careful clinical/legal oversight before proxy removal.

## Bias Coverage Analysis

| Bias Type               | Addressed?    | Explanation                                                                                                                                               |
| ----------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Statistical Bias**    | Yes           | Directly quantifies arbitrary statistical dependence without linear/monotonic assumptions, preventing masked proxy detection                                |
| **Historical Bias**     | Indirectly    | Identifies features encoding historical discrimination patterns through non-linear pathways; does not correct underlying data generation                    |
| **Representation Bias** | Partially     | Detects dependence regardless of group balance, but power decreases in extremely sparse protected attribute categories                                      |
| **Measurement Bias**    | Conditionally | Assumes accurate feature measurement; systematic measurement error correlated with protected attributes inflates dependence estimates                       |
| **Algorithmic Bias**    | Yes (Primary) | Core contribution: uncovers hidden proxy relationships that algorithms exploit for discriminatory prediction                                                |
| **Evaluation Bias**     | Yes           | Replaces marginal linear correlation with rigorous independence testing, preventing false assurances of fairness                                            |

## Features
- Assumption-free Distance Correlation computation for arbitrary data types
- Permutation testing with Benjamini-Hochberg FDR control
- Automated proxy flagging with configurable significance/magnitude thresholds
- Targeted post-processing mitigation (linear & non-linear residualization)
- Scale-preserving transformations for downstream compatibility
- Comprehensive reporting with dCor scores, p-values, and variance retention metrics
- Model-agnostic preprocessing compatible with any ML pipeline

## How the Algorithm Works
1. **Distance Matrix Computation**: Calculate pairwise Euclidean distances for each feature and the protected attribute
2. **Double Centering**: Apply row/column/global mean subtraction to isolate pure dependence structure
3. **dCor Calculation**: Compute normalized distance covariance to yield dependence strength in [0,1]
4. **Significance Testing**: Generate empirical null distribution via attribute permutation; calculate p-values
5. **FDR Control**: Apply Benjamini-Hochberg correction; flag features exceeding adjusted p-value and dCor thresholds
6. **Proxy Residualization**: For each flagged feature, predict from protected attribute using flexible regressor
7. **Signal Preservation**: Replace original feature with residual; restore scale to maintain downstream compatibility
8. **Output**: Cleaned dataset with proxy leakage removed, plus transformation metadata for audit trails

## Installation
```bash
pip install numpy pandas scikit-learn scipy
git clone https://github.com/yourorg/dcor-proxy-scanner.git
cd dcor-proxy-scanner