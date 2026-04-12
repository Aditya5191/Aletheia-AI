# Recidivism Fairness Diagnostics & Threshold Calibration

## Title
Fair Prediction with Disparate Impact: Diagnostic Analysis & Tradeoff-Aware Calibration

## Overview
This implementation provides tools to detect, quantify, and manage fairness disparities in risk prediction instruments, based on the analytical framework of Chouldechova (2017). The package computes group-conditional error rates, validates predictive parity, calculates theoretical penalty disparities, and offers threshold calibration utilities that enable explicit tradeoff management between PPV parity, FPR balance, and FNR balance.

## Problem Being Solved
Risk prediction tools used in high-stakes domains often produce disparate outcomes across demographic groups due to differing base rates. Multiple fairness criteria are mathematically incompatible, forcing practitioners to make explicit tradeoffs. This library addresses the need for rigorous diagnostic metrics and calibrated threshold selection that transparently balances predictive accuracy, error rate equity, and real-world policy impact.

## Sector Suitability Analysis

### Hiring & HR
**Suitability**: MODERATELY SUITABLE  
**Justification**: 
- *Type of data required*: Candidate assessment scores, interview ratings, qualification metrics
- *Bias type handled*: Addresses FPR/FNR disparities in screening qualified vs unqualified candidates across demographics
- *Mediators involved*: ATS platforms, HR screening committees; threshold calibration maps to interview selection rules
- *Note*: Base rate differences may reflect historical access disparities; FPR balance prioritizes preventing false rejections, but PPV parity may be preferred for quality control

### Lending & Finance
**Suitability**: SUITABLE  
**Justification**:
- *Type of data required*: Credit scores, income, debt ratios, default labels
- *Bias type handled*: Balances approval rates for creditworthy applicants (FNR) vs risk of default (FPR) across groups with different financial base rates
- *Mediators involved*: Loan origination systems, underwriting models; threshold calibration aligns with risk-based pricing tiers
- *Note*: Regulatory frameworks (ECOA, Fair Lending) emphasize predictive validity; explicit tradeoff documentation supports compliance audits

### Healthcare
**Suitability**: CONDITIONALLY SUITABLE  
**Justification**:
- *Type of data required*: Clinical risk scores, diagnostic probabilities, outcome labels
- *Bias type handled*: Mitigates disparate false positive rates (unnecessary interventions) and false negative rates (missed diagnoses) across demographic groups
- *Mediators involved*: Clinical decision support, triage protocols; threshold calibration maps to treatment initiation criteria
- *Note*: Clinical harm asymmetry often requires FNR minimization; PPV parity may be secondary to patient safety; requires domain-specific cost weighting

### Criminal Justice
**Suitability**: HIGHLY SUITABLE  
**Justification**:
- *Type of data required*: Risk assessment scores, recidivism outcomes, demographic identifiers, penalty ranges
- *Bias type handled*: Directly addresses FPR/FNR imbalances in bail, sentencing, and parole decisions; quantifies penalty disparity Δ
- *Mediators involved*: Pretrial services, sentencing commissions, parole boards; threshold calibration maps to risk classification tiers
- *Note*: Ground truth labels often reflect policing bias; requires explicit acknowledgment of measurement bias and policy context

### Education
**Suitability**: LIMITED SUITABILITY  
**Justification**:
- *Type of data required*: Academic risk scores, graduation/retention outcomes, demographic data
- *Bias type handled*: Addresses disparate identification for interventions or disciplinary actions
- *Mediators involved*: Academic advising systems, early alert platforms; threshold calibration maps to intervention eligibility
- *Note*: Penalty structure differs from criminal justice; interventions are typically beneficial rather than punitive, altering fairness priorities

### Summary Assessment
| Domain | Suitability | Primary Reason |
|--------|-------------|---------------|
| Criminal Justice | ★★★★★ | Direct alignment with paper's focus; clear penalty structure; base rate differences well-documented |
| Lending & Finance | ★★★★☆ | Strong regulatory fit; quantifiable cost asymmetries; threshold calibration maps to underwriting |
| Healthcare | ★★★☆☆ | Clinical harm asymmetry requires careful metric weighting; label validity concerns |
| Hiring & HR | ★★★☆☆ | Base rate differences often structural; PPV vs FPR tradeoffs context-dependent |
| Education | ★★☆☆☆ | Intervention vs penalty framing alters fairness priorities; different cost structures |

**Best Suited Domain(s)**: Criminal Justice, Lending & Finance  
**Least Suitable Domain(s)**: Education, Healthcare (without domain-specific cost modeling)  
**Reasoning**: Domains with explicit binary decision thresholds, quantifiable penalty/cost asymmetries, and documented base rate disparities benefit most. Domains where outcomes are non-punitive or heavily confounded by systemic access barriers require careful adaptation of tradeoff priorities.

## Features
- Group-conditional metric computation (Prevalence, PPV, FPR, FNR, TPR)
- Predictive Parity and Error Rate Balance validation
- Prevalence-error relationship verification (Equation 2.6 consistency check)
- Penalty disparity calculation (Δ) under configurable policy ranges
- Threshold calibration with explicit tradeoff management (FPR balance, FNR balance, PPV parity)
- Covariate-adjusted diagnostic support (compatible with external regression outputs)
- Comprehensive reporting with support counts and numerical stability handling

## Limitations & Assumptions

### Label Validity Assumption
Treats observed outcomes as ground truth; differential policing, clearance rates, and underreporting introduce measurement bias that cannot be corrected by threshold adjustment.

### Mathematical Impossibility
Cannot simultaneously satisfy predictive parity and error rate balance when base rates differ; calibration requires explicit tradeoff acceptance.

### Binary Threshold Focus
Analyzes single decision boundaries; continuous risk integration or multi-tier classification requires extension.

### Static Policy Assumption
Penalty disparity calculation assumes fixed t_min/t_max; real-world sentencing involves judicial discretion and guidelines.

### Pairwise Group Comparison
Optimized for binary protected attributes; multi-group calibration requires iterative pairwise optimization or aggregation.

### No Feedback Loop Modeling
Does not account for how calibrated thresholds alter future behavior, arrest rates, or base rates over time.

### Legal/Regulatory Context
Group-specific thresholds may face legal challenges in jurisdictions requiring uniform decision standards.

## How the Algorithm Works
1. **Audit Phase**: Compute PPV, FPR, FNR, and prevalence per protected group at a given risk threshold
2. **Parity Validation**: Test whether PPV (predictive parity) or FPR/FNR (error rate balance) meet tolerance thresholds
3. **Disparity Quantification**: Calculate expected penalty difference Δ between groups for non-recidivists
4. **Consistency Check**: Verify observed metrics satisfy the theoretical prevalence-PPV-error relationship
5. **Calibration Phase**: Optimize group-specific thresholds to minimize chosen disparity metric while constraining others within tolerance
6. **Deployment Phase**: Apply calibrated thresholds to generate adjusted predictions with documented tradeoffs

## Bias Type Coverage

| Bias Type               | Addressed?    | Explanation                                                                                                                                     |
| ----------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Statistical Bias**    | Yes           | Directly models how differing base rates (prevalence) force statistical tradeoffs between PPV, FPR, and FNR across groups                       |
| **Historical Bias**     | Conditionally | Acknowledges that historical discrimination in policing and sentencing affects observed recidivism rates, but treats *Y* as fixed for analysis  |
| **Representation Bias** | Partially     | Examines how score distributions and prior record patterns differ by race, but does not correct sampling imbalances                             |
| **Measurement Bias**    | Yes (Primary) | Explicitly highlights that *Y = 0* (no observed recidivism) ≠ true non-recidivism due to differential clearance rates and underreporting        |
| **Algorithmic Bias**    | Yes           | Core contribution: demonstrates how algorithms optimized for predictive parity inherently produce disparate FPR/FNR, leading to unfair outcomes |
| **Evaluation Bias**     | Yes           | Critiques single-metric fairness evaluations; shows how choosing PPV over error balance (or vice versa) changes perceived fairness              |

## Installation
```bash
pip install numpy pandas scikit-learn
git clone https://github.com/yourorg/recidivism-fairness-toolkit.git
cd recidivism-fairness-toolkit