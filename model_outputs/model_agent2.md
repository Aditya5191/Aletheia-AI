# Behavioral Fairness Audit Report

## 1. Audit Summary
- **Primary Protected Attribute**: gender
- **Secondary Protected Attribute**: race/ethnicity
- **Ground Truth**: Usable (150 non-null entries)
- **Algorithms Selected**:
  - Mitigation: `equality_of_opportunity`
  - Proxy: `mutual_info_proxy_scanner`
  - Intersectional: `intersectional_subgroup_scan`
  - SHAP: `shap_proxy_detection`

## 2. Verdict
**FAIL.** The model systematically harms males by under-predicting their positive outcomes (PPR 30.6% vs 50.0% for females) despite males having a higher base outcome rate (50.0% vs 32.1%). This leads to severe violations of Equal Opportunity (EOD = 0.3367) and Equalized Odds, meaning qualified males are much more likely to be falsely rejected.

## 3. Group Parity Metrics
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| DIR (Disparate Impact Ratio) | 0.6111 | >= 0.80 | FAIL |
| SPD (Statistical Parity Difference) | 0.1944 | <= 0.10 | FAIL |
| EOD (Equal Opportunity Difference) | 0.3367 | <= 0.10 | FAIL |
| FPRD (False Positive Rate Difference) | 0.2741 | <= 0.10 | FAIL |

**Base Rates (Gender):**
- Female: 32.1%
- Male: 50.0%

**Secondary Attribute Findings (Race/Ethnicity):**
- FPR Multiplier: Infinity (Group E FPR = 0.0%, Group D FPR = 33.3%)

## 4. Counterfactual Evidence
When probing the model with a baseline median applicant and varying only the protected attribute (`gender`), the prediction score remains identical (Delta = 0.0). This indicates the model achieves "fairness through unawareness" by not using gender directly, but it still exhibits severe bias through proxy features.

## 5. Proxy Findings
- **SHAP Proxy Detection**: `reading score` was flagged as a proxy for gender (Proxy Score: 0.0912). It has high feature importance and correlates with gender, leaking demographic information into the model.
- **Mutual Information Proxy Scanner**: No statistically significant non-linear proxies were found after FDR correction.

## 6. Intersectional Findings
- **Significant Disparity**: The intersection of `gender` and `race/ethnicity` shows a severe disparate impact (DIR = 0.3368).
- **Worst Subgroup**: Male, Group D (Positive Prediction Rate = 21.1%)
- **Best Subgroup**: Female, Group D (Positive Prediction Rate = 62.5%)

## 7. Handover Notes for Threshold Calibrator
- **Mitigation Algorithm**: `equality_of_opportunity`
- **Failed Metrics**: DIR, SPD, EOD, FPRD all failed.
- **Most Harmed Group**: Males (specifically Male, Group D).
- **Ground Truth Availability**: Yes, ground truth is available and usable.
- **Action Required**: Use the `equality_of_opportunity` algorithm to optimize group-specific thresholds to equalize TPR and FPR across genders, as males are currently experiencing a massive false negative penalty.