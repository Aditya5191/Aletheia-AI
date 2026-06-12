# Model Inspector Profile

## Model Identity
- **File**: `model.pkl`
- **Model Type**: `RandomForestClassifier`
- **Final Estimator**: `RandomForestClassifier`
- **Expected Features**: `reading score`, `writing score`
- **Pipeline**: No
- **SHAP Method Used**: `TreeExplainer`

## Sample Overview
- **Rows**: 150
- **Ground Truth Available?**: Yes (`outcome`)
- **Prediction Distribution**: 40.67% overall positive prediction rate. Accuracy is 77.33%.

## Feature Inventory
| Feature | Dtype | Role | SHAP Rank | SHAP Importance |
|---------|-------|------|-----------|-----------------|
| reading score | int64 | REGULAR | 1 | 0.180 |
| writing score | int64 | REGULAR | 2 | 0.133 |
| gender | object | PROTECTED | - | - |
| race/ethnicity | object | PROTECTED | - | - |
| parental level of education | object | PROXY | - | - |
| lunch | object | PROXY | - | - |
| test preparation course | object | PROXY | - | - |
| outcome | int64 | TARGET | - | - |

## Protected Attributes Detected
- **gender**: female (78 rows), male (72 rows)
- **race/ethnicity**: group A (14 rows), group B (24 rows), group C (48 rows), group D (43 rows), group E (21 rows)

## SHAP Feature Importance
1. **reading score** (0.180)
2. **writing score** (0.133)

## Proxy Risk Analysis
Pearson r vs `gender`:
- **lunch**: 0.131
- **parental level of education**: -0.051
- **test preparation course**: -0.002

## Prediction Distribution
Positive prediction rate per group:
- **gender**:
  - female: 50.0%
  - male: 30.6%
- **race/ethnicity**:
  - group A: 42.9%
  - group B: 45.8%
  - group C: 33.3%
  - group D: 44.2%
  - group E: 44.4%

## Handover Notes for Behavioral Auditor
- **Primary Protected Attribute**: `gender`
- **Secondary Protected Attribute**: `race/ethnicity`
- **Ground-Truth Column**: `outcome`
- **Top Proxies**: `lunch` has a slight correlation with `gender`.
- **Notes**: The model only uses `reading score` and `writing score` as features. There is a significant gap in positive prediction rates between females (50.0%) and males (30.6%). The Behavioral Auditor should investigate this disparity further.