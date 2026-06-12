# Mitigation & Calibration Report

## 1. Overall Result
By applying the `equality_of_opportunity` algorithm (Equalized Odds mode), we successfully calibrated group-specific decision thresholds for gender. The Equal Opportunity Difference (EOD) was reduced from **0.337 to 0.022** (a 93% reduction), and the False Positive Rate Difference (FPRD) was reduced from **0.274 to 0.045** (an 84% reduction).

## 2. What Was Actually Fixed
- **Equalized Odds**: Both True Positive Rates (TPR) and False Positive Rates (FPR) are now balanced across genders.
- **Male Penalty Removed**: The most harmed group (Males) previously suffered a massive false negative penalty (TPR of 58.3%). With the new threshold, Male TPR has increased to 77.8%, closely matching the Female TPR of 80.0%.
- **Female False Positives Reduced**: Females previously had an inflated FPR of 30.2%. The new threshold reduced this to 9.4%, aligning it with the Male FPR of 13.9%.

## 3. Accuracy Trade-off
- **Accuracy Before**: 77.3%
- **Accuracy After**: 84.7%
- **Trade-off**: **+7.4%**
- *Note*: The accuracy actually *improved* because the model's default 0.50 threshold was highly suboptimal for this dataset. The fairness calibration found thresholds that better separated the classes while enforcing fairness constraints.

## 4. What Could Not Be Fully Fixed
- **Disparate Impact Ratio (DIR)**: Improved from 0.611 to 0.699, but still falls short of the 0.80 compliance threshold.
- **Statistical Parity Difference (SPD)**: Improved from 0.194 to 0.138, but remains slightly above the 0.10 threshold.
- *Reason*: Because the base rates of the outcome differ significantly between genders (Males 50.0%, Females 32.1%), achieving perfect Equalized Odds mathematically prevents achieving perfect Statistical Parity.

## 5. Threshold Map
To deploy this fix without retraining the model, replace the default `0.50` probability cutoff with the following group-specific thresholds:

```json
{
  "protected_attribute": "gender",
  "thresholds": {
    "female": 0.717,
    "male": 0.232
  },
  "fairness_metric_equalized": "Equalized Odds (TPR and FPR)",
  "accuracy_tradeoff": "+7.4%",
  "how_to_use": "Apply the group threshold instead of a fixed 0.50 cutoff."
}
```

## 6. Before-vs-After Comparison

### Prediction Rates by Group
| Group | PPR Before | PPR After | TPR Before | TPR After | FPR Before | FPR After |
|-------|------------|-----------|------------|-----------|------------|-----------|
| Female| 50.0%      | 32.1%     | 92.0%      | 80.0%     | 30.2%      | 9.4%      |
| Male  | 30.6%      | 45.8%     | 58.3%      | 77.8%     | 2.8%       | 13.9%     |

## 7. Fairness Metrics
| Metric | Before | After | Threshold | Status After |
|--------|--------|-------|-----------|--------------|
| DIR    | 0.611  | 0.699 | >= 0.80   | **FAIL**     |
| SPD    | 0.194  | 0.138 | <= 0.10   | **FAIL**     |
| EOD    | 0.337  | 0.022 | <= 0.10   | **PASS**     |
| FPRD   | 0.274  | 0.045 | <= 0.10   | **PASS**     |

## 8. Compliance Status
- **EEOC 4/5ths Rule (DIR)**: **FAIL**. The DIR is 0.699, which is below the 0.80 threshold.
- **Equal Opportunity (EOD)**: **PASS**. The EOD is 0.022, well within the 0.10 tolerance.
- **Equalized Odds (EOD + FPRD)**: **PASS**. Both TPR and FPR disparities are under 0.10.

## 9. Recommended Next Steps
1. **Deploy Thresholds**: Implement the group-specific thresholds in the prediction pipeline immediately to resolve the Equal Opportunity violations.
2. **Investigate Base Rates**: The remaining DIR/SPD failures are driven by underlying base rate differences. Investigate the data collection process to ensure the ground truth labels are not themselves biased.
3. **Feature Engineering**: Remove or transform the `reading score` feature, which was previously identified as a strong proxy for gender, and retrain the model to see if baseline fairness improves.

## 10. Pipeline Run Summary
- **Algorithm**: `equality_of_opportunity`
- **Mode**: Equalized Odds
- **Target Attribute**: `gender`
- **Artifacts Generated**: `threshold_map.json`, `fixed_predictions.csv`, `model_agent3_charts.json`, `model_agent3_metrics.json`
