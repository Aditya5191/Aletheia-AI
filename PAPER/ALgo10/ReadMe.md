# Orthogonal to Bias (OB) - Counterfactual Fairness Pre-processor

## Title
Counterfactual Fairness through Transforming Data Orthogonal to Bias

## Overview
This implementation provides a model-agnostic, pre-processing framework for achieving counterfactual fairness in machine learning pipelines. Based on the Orthogonal to Bias (OB) algorithm, the toolkit transforms non-sensitive features to be mathematically orthogonal (uncorrelated) with sensitive attributes, minimizing reconstruction error while breaking bias transmission pathways. The package includes closed-form OB and sparse SOB variants, comprehensive bias auditing utilities, and seamless integration with standard ML workflows.

## Problem Being Solved
Algorithmic systems trained on historical data frequently encode discriminatory patterns through continuous or multivariate sensitive attributes that correlate with predictive features. Existing counterfactual fairness methods require complete causal knowledge, handle only categorical sensitive variables, or aggressively discard predictive signal. This library addresses the need for a computationally efficient, theoretically grounded pre-processing technique that decorrelates sensitive and non-sensitive features with minimal data distortion, enabling fair downstream modeling without architectural changes or accuracy collapse.

## Sector Suitability Analysis

### Hiring & HR
**Suitability**: HIGHLY SUITABLE  
**Justification**: 
- *Type of data required*: Candidate assessments, education history, work experience, demographic indicators
- *Bias type handled*: Algorithmic bias via continuous socioeconomic or demographic proxies; OB removes linear dependence while preserving skill/qualification signal
- *Mediators involved*: ATS platforms, HR screening pipelines; pre-processing integrates before ranking/classification models
- *Note*: Counterfactual fairness aligns with individual merit evaluation; minimal distortion preserves candidate differentiation

### Lending & Finance
**Suitability**: SUITABLE WITH CAUTION  
**Justification**:
- *Type of data required*: Credit history, income stability, debt ratios, geographic/demographic features
- *Bias type handled*: Removes linear encoding of race/gender/SES into creditworthiness features while maintaining default-predictive power
- *Mediators involved*: Underwriting engines, risk scoring systems; decorrelation aligns with fair lending compliance (ECOA, Reg B)
- *Note*: Financial data often exhibits non-linear dependencies; may require complementary non-linear fairness checks; regulatory documentation required

### Healthcare
**Suitability**: MODERATELY SUITABLE  
**Justification**:
- *Type of data required*: Clinical biomarkers, utilization history, socioeconomic indicators, demographic attributes
- *Bias type handled*: Reduces demographic encoding in clinical risk scores while preserving prognostic signal
- *Mediators involved*: Clinical decision support, EHR analytics; pre-processing requires clinical validation to avoid stripping legitimate biological/demographic risk factors
- *Note*: Medical outcomes often have complex causal pathways; linear decorrelation may oversimplify; requires domain-specific causal review

### Criminal Justice
**Suitability**: CONDITIONALLY SUITABLE  
**Justification**:
- *Type of data required*: Prior records, charge severity, employment status, geographic/demographic features
- *Bias type handled*: Breaks linear pathways from race/SES to risk assessment features while preserving recidivism-predictive signal
- *Mediators involved*: Pretrial risk tools, sentencing advisory systems; decorrelation supports equitable scoring frameworks
- *Note*: Label validity (arrest ≠ reoffense) and systemic confounding may persist; requires explicit policy alignment and counterfactual audit validation

### Education
**Suitability**: SUITABLE  
**Justification**:
- *Type of data required*: Test scores, GPA, socioeconomic status, school district indicators, demographic attributes
- *Bias type handled*: Removes demographic encoding from academic predictors while preserving merit-based differentiation
- *Mediators involved*: Admissions pipelines, equity monitoring systems, early alert platforms; pre-processing supports transparent, defensible scoring
- *Note*: Well-aligned with individual counterfactual fairness principles; minimal distortion preserves academic ranking integrity

### Summary Assessment
| Domain | Suitability | Primary Reason |
|--------|-------------|---------------|
| Hiring & HR | ★★★★★ | Clear counterfactual fairness alignment; continuous features well-suited; minimal signal loss preserves merit ranking |
| Lending & Finance | ★★★★☆ | Strong regulatory fit; handles continuous SES proxies; requires non-linear dependency validation |
| Education | ★★★★☆ | Supports individual merit evaluation; transparent pre-processing; aligns with equity auditing |
| Healthcare | ★★★☆☆ | Clinical causal complexity; linear decorrelation may oversimplify biological/demographic risk interactions |
| Criminal Justice | ★★☆☆☆ | Label validity concerns; systemic confounding; requires policy-level counterfactual validation |

**Best Suited Domain(s)**: Hiring & HR, Lending & Finance, Education  
**Least Suitable Domain(s)**: Criminal Justice, Healthcare (without domain-specific causal validation & non-linear fairness extensions)  
**Reasoning**: Domains with continuous/multivariate sensitive attributes, clear counterfactual fairness objectives, and tolerance for linear decorrelation benefit most. Domains with complex causal pathways, biased outcome labels, or strict non-linear dependency requirements need additional validation layers before deployment.

## Bias Coverage Analysis

| Bias Type               | Addressed?    | Explanation                                                                                                                                               |
| ----------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Statistical Bias**    | Yes           | Directly removes linear statistical dependence (covariance) between sensitive and non-sensitive features                                                    |
| **Historical Bias**     | Indirectly    | Breaks pathways that encode historical discrimination patterns into downstream predictions, though does not correct upstream data generation                |
| **Representation Bias** | Partially     | Preserves overall data structure and rank; does not explicitly rebalance group sizes but prevents biased feature encoding                                   |
| **Measurement Bias**    | Conditionally | Assumes features are accurately measured; if sensitive attributes contain systematic measurement error, decorrelation may propagate noise                   |
| **Algorithmic Bias**    | Yes (Primary) | Core contribution: eliminates counterfactual unfairness by ensuring model inputs are orthogonal to protected attributes                                     |
| **Evaluation Bias**     | Yes           | Shifts evaluation from marginal group parity to counterfactual stability, providing more individual-aligned fairness assessment                             |

## Features
- Closed-form Orthogonal to Bias (OB) transformation with minimal reconstruction error
- Sparse OB (SOB) variant for high-dimensional stability and feature interpretability
- Comprehensive bias auditing: correlation analysis, counterfactual stability approximation, observational fairness metrics
- Model-agnostic pre-processing compatible with any sklearn-compatible estimator
- Automatic standardization and inverse-standardization for seamless pipeline integration
- Rank selection guidance and post-transformation decorrelation verification
- Detailed transformation metadata for audit trails and compliance reporting

## How the Algorithm Works
1. **Standardization**: Normalize non-sensitive (A) and sensitive (B) features to zero mean, unit variance
2. **Rank Determination**: Select approximation rank k (defaults to min(features, samples))
3. **SVD Decomposition**: Compute singular value decomposition of standardized A
4. **Bias Projection Removal**: Solve for Lagrange multipliers to subtract sensitive attribute projections from each singular direction
5. **Matrix Reconstruction**: Combine cleaned scores and singular vectors to produce A~ orthogonal to B
6. **Inverse Standardization**: Restore original scale while preserving decorrelation
7. **Validation**: Verify max post-transformation correlation and reconstruction error
8. **Deployment**: Feed A~ into downstream ML models; predictions inherit counterfactual fairness guarantees

## Installation
```bash
pip install numpy pandas scipy scikit-learn
git clone https://github.com/yourorg/orthogonal-to-bias-toolkit.git
cd orthogonal-to-bias-toolkit