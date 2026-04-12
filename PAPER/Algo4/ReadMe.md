# Intersectional Subgroup Fairness Scanner

## Title
Intersectional Subgroup Scan: Auditing & Mitigating Fairness Violations Across Demographic Intersections

## Overview
This implementation provides a rigorous, statistically grounded framework for discovering and correcting fairness violations in intersectional subgroups. Unlike traditional fairness audits that evaluate broad demographic categories, this tool efficiently searches combinatorial attribute spaces to identify small, overlapping populations where algorithmic outcomes disproportionately deviate from baseline fairness metrics. The package supports both detection (auditing) and mitigation (targeted adjustment) in a modular, production-ready pipeline.

## Problem Being Solved
Algorithmic fairness evaluations often mask disparities that exist at demographic intersections. For example, a model may appear fair for gender and race independently, but systematically disadvantage Black women or elderly Hispanic men. The paper addresses this by introducing an efficient subgroup scan algorithm that discovers statistically significant fairness violations across attribute combinations, then provides actionable mitigation pathways to correct them without global model retraining or severe utility degradation.

## Sector Suitability Analysis

### Hiring & HR
**Suitability**: HIGHLY SUITABLE  
**Justification**: 
- *Type of data required*: Candidate demographics, assessment scores, interview outcomes, hiring decisions
- *Bias type handled*: Intersectional bias in screening, interviewing, and offer stages; catches hidden disparities masked by aggregate diversity metrics
- *Mediators involved*: ATS platforms, HR analytics dashboards, compliance reporting tools; subgroup definitions map directly to EEOC reporting categories
- *Note*: Supports targeted policy adjustments for specific demographic intersections without blanket quota mandates

### Lending & Finance
**Suitability**: SUITABLE WITH CAUTION  
**Justification**:
- *Type of data required*: Credit scores, income, debt ratios, demographic attributes, approval/decline outcomes
- *Bias type handled*: Subgroup-level disparities in loan approval rates, interest pricing, or default risk calibration
- *Mediators involved*: Underwriting engines, risk modeling pipelines, regulatory compliance systems; threshold adjustments align with pricing tiers
- *Note*: Requires careful calibration to avoid violating risk-based pricing regulations; mitigation must preserve creditworthiness signal

### Healthcare
**Suitability**: MODERATELY SUITABLE  
**Justification**:
- *Type of data required*: Clinical risk scores, diagnostic outcomes, demographic/covariate data, treatment recommendations
- *Bias type handled*: Intersectional disparities in diagnostic accuracy, treatment referral rates, or risk stratification
- *Mediators involved*: Clinical decision support, triage protocols, quality assurance systems; subgroup alerts support clinical audit
- *Note*: Clinical harm asymmetry requires domain-specific thresholding; subgroup adjustments must not compromise patient safety or guideline adherence

### Criminal Justice
**Suitability**: CONDITIONALLY SUITABLE  
**Justification**:
- *Type of data required*: Risk assessment scores, recidivism outcomes, demographic identifiers, sentencing/bail decisions
- *Bias type handled*: Intersectional false positive/negative rate disparities in pretrial, sentencing, or parole tools
- *Mediators involved*: Risk assessment vendors, court administration, oversight commissions; subgroup reports support judicial review
- *Note*: Label validity concerns (arrest ≠ reoffense) may distort violation scores; mitigation requires explicit policy justification and stakeholder consensus

### Education
**Suitability**: SUITABLE  
**Justification**:
- *Type of data required*: Student demographics, academic performance, intervention eligibility, disciplinary outcomes
- *Bias type handled*: Intersectional disparities in tracking, resource allocation, disciplinary actions, or college admissions
- *Mediators involved*: Student information systems, early alert platforms, equity offices; subgroup identification guides targeted support
- *Note*: Interventions are typically beneficial; threshold adjustments align with tiered support models; supports Title IX/VI compliance auditing

### Summary Assessment
| Domain | Suitability | Primary Reason |
|--------|-------------|---------------|
| Hiring & HR | ★★★★★ | Direct alignment with EEOC intersectional reporting; clear demographic intersections; actionable policy levers |
| Lending & Finance | ★★★★☆ | Strong regulatory fit; subgroup risk calibration; requires compliance review for threshold adjustments |
| Education | ★★★★☆ | Supports equity targeting; aligns with intervention tiers; institutional oversight capacity |
| Healthcare | ★★★☆☆ | Clinical safety priorities; requires domain validation; label uncertainty in outcomes |
| Criminal Justice | ★★☆☆☆ | Label validity concerns; high-stakes ethical implications; requires judicial/policy alignment |

**Best Suited Domain(s)**: Hiring & HR, Lending & Finance, Education  
**Least Suitable Domain(s)**: Criminal Justice, Healthcare (without domain-specific validation & policy alignment)  
**Reasoning**: Domains with structured demographic attributes, clear outcome labels, and institutional capacity for subgroup policy adjustment benefit most. Domains where labels reflect systemic bias or where adjustments carry life-altering consequences require rigorous validation and stakeholder governance.

## Bias Coverage Analysis

| Bias Type               | Addressed?    | Explanation                                                                                                                                               |
| ----------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Statistical Bias**    | Yes           | Directly quantifies subgroup-level deviation from global fairness baselines with statistical significance testing                                         |
| **Historical Bias**     | Indirectly    | Identifies subgroups where historical disadvantage compounds into algorithmic disparity, though does not correct underlying data generation                 |
| **Representation Bias** | Yes (Primary) | Explicitly targets intersectional subgroups with sparse representation, preventing marginalization of small demographic intersections                     |
| **Measurement Bias**    | Conditionally | Relies on accurate outcome labels; biased measurements in specific subgroups will propagate through violation scores                                      |
| **Algorithmic Bias**    | Yes           | Core contribution: discovers how model errors or thresholds systematically disadvantage intersectional populations                                        |
| **Evaluation Bias**     | Yes           | Shifts evaluation from aggregate metrics to subgroup-level audits, preventing masked disparities through averaging                                        |

## Features
- Intersectional subgroup discovery via efficient tree-based scan
- Statistical significance testing with false discovery control
- Configurable fairness metrics (positive rate, calibration error, FPR/FNR disparity)
- Targeted post-processing mitigation (threshold adjustment & reweighting)
- Confidence interval reporting for subgroup metrics
- Modular detection/mitigation pipeline for independent or chained use
- Comprehensive audit reporting with subgroup definitions and violation magnitudes

## How the Algorithm Works
1. **Baseline Computation**: Calculate global fairness metric across full dataset
2. **Recursive Scanning**: Expand subgroups by adding attribute-value conditions that maximize normalized violation score
3. **Statistical Filtering**: Apply support thresholds and significance testing to eliminate noisy or spurious subgroups
4. **Ranking & Output**: Return top violating subgroups with conditions, support, metrics, and confidence intervals
5. **Mitigation Application**: Adjust prediction scores or generate sample weights proportional to violation magnitude for identified subgroups
6. **Validation**: Recompute fairness metrics on adjusted outputs to verify disparity reduction

## Installation
```bash
pip install numpy pandas scipy scikit-learn
git clone https://github.com/yourorg/intersectional-fairness-scanner.git
cd intersectional-fairness-scanner
