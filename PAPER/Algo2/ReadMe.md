# Equalized Odds & Equal Opportunity Post-Processor

## Title
Equality of Opportunity in Supervised Learning: Post-Processing Fairness Mitigation

## Overview
This implementation provides algorithms to detect and mitigate algorithmic bias using the Equalized Odds and Equal Opportunity frameworks introduced by Hardt, Price, and Srebro (2016). The package enables practitioners to audit group-wise performance disparities and apply model-agnostic post-processing to enforce fairness constraints while preserving predictive utility.

## Problem Being Solved
Machine learning models often produce discriminatory outcomes due to proxy features, imbalanced data, or optimization objectives that ignore group parity. Traditional fairness criteria like demographic parity degrade accuracy and permit unqualified selections. This library addresses the need for actionable, accuracy-aligned fairness enforcement that equalizes true positive and false positive rates across protected groups without retraining underlying models.

## Sector Suitability Analysis

### Hiring & HR
**Suitability**: HIGHLY SUITABLE  
**Justification**: 
- *Type of data required*: Candidate scores, assessment results, interview ratings (continuous/ordinal)
- *Bias type handled*: Algorithmic bias in screening tools; equalizes selection rates among qualified candidates across demographics
- *Mediators involved*: HR analytics platforms, ATS screening pipelines; post-processing integrates seamlessly as a filtering layer
- *Note*: Equal opportunity aligns well with merit-based hiring where only qualified candidates (Y=1) should receive offers

### Lending & Finance
**Suitability**: SUITABLE  
**Justification**:
- *Type of data required*: Credit scores, income, debt-to-income ratios, application features
- *Bias type handled*: Equalizes approval rates for creditworthy applicants (equal opportunity) or both approval/default rates (equalized odds)
- *Mediators involved*: Loan origination systems, credit scoring engines; threshold adjustments map directly to underwriting rules
- *Note*: Requires reliable default labels (Y); regulatory acceptance depends on transparent threshold documentation

### Healthcare
**Suitability**: MODERATELY SUITABLE  
**Justification**:
- *Type of data required*: Clinical risk scores, lab values, imaging model outputs
- *Bias type handled*: Mitigates diagnostic/treatment recommendation disparities across racial/gender groups
- *Mediators involved*: Clinical decision support systems; requires careful validation as medical outcomes often have delayed/uncertain ground truth
- *Note*: Label reliability (Y) is critical; equalized odds may restrict optimal clinical utility if group-specific disease prevalence varies significantly

### Criminal Justice
**Suitability**: LIMITED SUITABILITY  
**Justification**:
- *Type of data required*: Risk assessment scores, criminal history features, recidivism labels
- *Bias type handled*: Attempts to equalize false positive rates (preventing unnecessary detention) and true positive rates across groups
- *Mediators involved*: Pretrial risk tools, parole boards; highly sensitive to label bias (arrest data ≠ true risk)
- *Note*: Ground truth Y is often proxy-biased; equalized odds may equalize around discriminatory policing patterns rather than true behavior

### Education
**Suitability**: SUITABLE  
**Justification**:
- *Type of data required*: Test scores, GPA, application metrics, scholarship eligibility scores
- *Bias type handled*: Equalizes admission/scholarship rates among qualified applicants; prevents systemic exclusion of underrepresented groups
- *Mediators involved*: Admissions committees, automated screening tools; post-processing allows policy-driven threshold calibration
- *Note*: Works well for binary outcomes (admit/deny); multi-criteria decisions require careful aggregation before applying post-processing

### Summary Assessment
| Domain | Suitability | Primary Reason |
|--------|-------------|---------------|
| Hiring & HR | ★★★★★ | Strong alignment with merit-based selection; clear qualified/unqualified distinction; integrates with ATS |
| Lending & Finance | ★★★★☆ | Regulatory compatibility; threshold mapping to underwriting; requires reliable default labels |
| Education | ★★★★☆ | Clear positive outcomes; institutional oversight; post-processing fits admissions workflows |
| Healthcare | ★★★☆☆ | Label uncertainty; clinical utility tradeoffs; requires domain-specific validation |
| Criminal Justice | ★★☆☆☆ | Proxy-biased ground truth; high-stakes ethical implications; may equalize around discriminatory patterns |

**Best Suited Domain(s)**: Hiring & HR, Lending & Finance, Education  
**Least Suitable Domain(s)**: Criminal Justice, Healthcare (without rigorous label validation)  
**Reasoning**: Domains with reliable ground truth outcomes, clear binary decision boundaries, and institutional capacity to audit threshold adjustments benefit most. Domains where labels reflect systemic bias rather than true outcomes risk equalizing around discriminatory baselines.

## Bias Coverage Analysis

| Bias Type               | Addressed?    | Explanation                                                                                                                                               |
| ----------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Statistical Bias**    | Yes           | Directly equalizes group-conditional error rates (TPR/FPR), ensuring statistically comparable performance across demographics                             |
| **Historical Bias**     | Indirectly    | Does not correct biased labels or historical discrimination in *Y*, but prevents amplification through threshold adjustments                              |
| **Representation Bias** | Partially     | If minority groups have sparse data leading to poor ROC curves, the method caps performance at their level; does not fix representation gaps              |
| **Measurement Bias**    | Conditionally | Assumes *Y* is accurately measured; if *Y* itself is biased (e.g., policing data for recidivism), equalized odds will equalize around biased ground truth |
| **Algorithmic Bias**    | Yes (Primary) | Core contribution: removes discriminatory decision boundaries by enforcing conditional independence of predictions and protected attributes               |
| **Evaluation Bias**     | Yes           | Shifts evaluation from marginal prediction parity to conditional performance parity, providing more meaningful fairness assessment                        |

## Features
- Equalized Odds & Equal Opportunity detection metrics
- Post-processing threshold optimization for score-based models
- Linear programming support for binary predictor adjustment (conceptual framework)
- Group-conditional ROC curve analysis
- Configurable loss functions (FP/FN cost weighting)
- Deterministic threshold approximation for production deployment
- Comprehensive fairness/accuracy reporting

## How the Algorithm Works
1. **Audit Phase**: Compute TPR and FPR for each protected group using validation data
2. **Fairness Assessment**: Calculate Equalized Odds Difference and Equal Opportunity Difference
3. **Optimization Phase**: Search for group-specific thresholds that equalize TPR (equal opportunity) or both TPR and FPR (equalized odds) while minimizing weighted loss
4. **Deployment Phase**: Apply calibrated thresholds to raw model scores to generate fair predictions
5. **Validation Phase**: Verify post-processed predictions satisfy fairness constraints without excessive utility degradation

## Installation
```bash
pip install numpy pandas scikit-learn scipy
git clone https://github.com/yourorg/equalized-odds-toolkit.git
cd equalized-odds-toolkit



## Limitations
- **Ground Truth Dependency**: Requires reliable, observed outcome labels; biased or missing labels produce biased fairness adjustments
- **Utility Ceiling**: Equalized odds caps performance at the intersection of group ROC curves; significant group performance gaps cause substantial accuracy loss
- **Oblivious Constraint**: Cannot distinguish between legitimate predictive correlations and discriminatory proxies; ignores causal mechanisms
- **Binary Assumption**: Core algorithms assume binary outcomes and protected attributes; multi-class extensions require manual aggregation
- **Deterministic Approximation**: Strict equalized odds may require randomized thresholding; this implementation uses deterministic approximations that may not achieve exact parity
- **No Data Correction**: Does not address sampling bias, historical bias, or label bias; only adjusts decision boundaries
- **Validation Data Requirement**: Requires held-out labeled data for threshold calibration; performance may drift on new distributions
