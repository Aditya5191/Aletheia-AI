# Model Audit Test Assets

This folder contains classification and regression models and matching sample datasets generated from the `dataset/Education/StudentsPerformance.csv` dataset. You can use these files to test the model audit backend.

## 1. Classification Model

- **Model File:** `classification_model.pkl` (RandomForestClassifier)
- **Sample Data:** `classification_sample.csv`
- **Target Column:** `outcome` (Binary: 1 if math score >= 70, else 0)
- **Protected Attributes:** `gender`, `race/ethnicity`
- **Model Features:** `reading score`, `writing score`

### Usage/Config
When uploading to the backend `/upload/config` endpoint, use the following payload:
```json
{
  "target_column": "outcome",
  "protected_attributes": ["gender", "race/ethnicity"]
}
```

---

## 2. Regression Model

- **Model File:** `regression_model.pkl` (GradientBoostingRegressor)
- **Sample Data:** `regression_sample.csv`
- **Target Column:** `score` (Continuous math score)
- **Protected Attributes:** `gender`, `race/ethnicity`
- **Model Features:** `reading score`, `writing score`

### Usage/Config
When uploading to the backend `/upload/config` endpoint, use the following payload:
```json
{
  "target_column": "score",
  "protected_attributes": ["gender", "race/ethnicity"]
}
```
