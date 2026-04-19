# Algorithm 2: Equality of Opportunity in Supervised Learning

## 1. Objective
Achieve fairness by post-processing the output scores of any pre-trained machine learning model without retraining. This method enforces Equal Opportunity (equal True Positive Rates) or Strict Equalized Odds (equal True Positive Rates AND equal False Positive Rates) across different demographic groups.

## 2. Detection (Equalized Odds Difference)
Quantify the disparity in how the model treats different demographic groups when predicting positive/negative outcomes.

**Mathematical Foundation:**
- **True Positive Rate (TPR):** `TPR = TP / (TP + FN)` = `P(Predicted=1 | Actual=1)`
- **False Positive Rate (FPR):** `FPR = FP / (FP + TN)` = `P(Predicted=1 | Actual=0)`
- **Equal Opportunity Violation:** `abs(TPR_group0 - TPR_group1)`
- **Equalized Odds Violation:** `max(abs(TPR_group0 - TPR_group1), abs(FPR_group0 - FPR_group1))`

**Inputs Required:**
- `y_true`: numpy array. Actual binary labels (0 or 1). Shape (n_samples,).
- `y_pred`: numpy array. Predicted binary labels using the model's default threshold. Shape (n_samples,).
- `protected_attr`: numpy array. Group membership identifiers (e.g., 0 and 1). Shape (n_samples,).

**Pseudo-code Implementation:**
1. Isolate predictions based on group identities (group 0 vs group 1).
2. For each group, compute:
   - `TPR = TruePositives / TotalActualPositives`
   - `FPR = FalsePositives / TotalActualNegatives`
3. Check Parities:
   - Equal Opportunity Violation = `abs(TPR_group0 - TPR_group1)`
   - Equalized Odds Violation = `max(abs(TPR_group0 - TPR_group1), abs(FPR_group0 - FPR_group1))`

**Output Specification:**
Returns a dictionary:
```python
{
    "tpr_group0": float,              # TPR for group 0
    "tpr_group1": float,              # TPR for group 1
    "fpr_group0": float,              # FPR for group 0
    "fpr_group1": float,              # FPR for group 1
    "equal_opportunity_violation": float,  # abs(TPR difference)
    "equalized_odds_violation": float,     # max(TPR diff, FPR diff)
    "is_fair_opportunity": bool,      # True if TPR diff <= tolerance
    "is_fair_odds": bool              # True if max diff <= tolerance
}
```

## 3. Mitigation (Threshold Optimization)
Identifies the optimal distinct classification threshold for each demographic group to force their TPRs (and optionally FPRs) to exactly match, minimizing overall prediction loss.

**Inputs Required:**
- `scores`: numpy array. Raw probabilities or continuous output from the model. Shape (n_samples,).
- `y_true`: numpy array. Ground truth binary labels. Shape (n_samples,).
- `protected_attr`: numpy array. Group identifiers. Shape (n_samples,).
- `loss_ratio`: Float. Weight penalizing false positives relative to false negatives. Default: 1.0. Increase to 2.0-5.0 when false positives are costlier (e.g., lending). Decrease to 0.5 when false negatives are costlier (e.g., disease screening).
- `tolerance`: Float. Maximum acceptable fairness violation. Default: 0.05. Tighten to 0.01 for strict legal compliance. Widen to 0.10 for exploratory analysis.
- `n_grid_steps`: Integer. Number of candidate thresholds in the search grid. Default: 100. Increase to 200 for fine-grained search on large datasets. Decrease to 50 for faster computation on small datasets.
- `mitigation_mode`: String. "equal_opportunity" (TPR only) or "equalized_odds" (TPR + FPR). Default: "equalized_odds".

**Default Parameter Tuning Guide:**
- `loss_ratio`: 1.0 treats FP and FN equally. In hiring, set to 2.0 (FP = bad hire is costly). In medical screening, set to 0.3 (FN = missed diagnosis is dangerous).
- `tolerance`: 0.05 is the standard. If the optimizer returns no valid pair, widen to 0.10 before concluding infeasibility.
- `n_grid_steps`: 100 gives thresholds at every 0.01 increment. For datasets < 500 rows, use 50 to avoid overfitting to threshold noise.
- `mitigation_mode`: Use "equalized_odds" for comprehensive fairness. Use "equal_opportunity" when only TPR parity matters (e.g., ensuring equal recall for all groups).

**Pseudo-code Implementation:**
1. Build a grid of candidate thresholds from 0.0 to 1.0 with `n_grid_steps` steps.
2. For each possible threshold combination `(t0, t1)` across groups:
   a. Subdivide the data by `protected_attr`.
   b. Compute `TPR_0(t0)`, `FPR_0(t0)`, `FNR_0(t0)` for group 0 at threshold `t0`.
   c. Compute `TPR_1(t1)`, `FPR_1(t1)`, `FNR_1(t1)` for group 1 at threshold `t1`.
3. Compute the Fairness Constraint Violation:
   - If `mitigation_mode == "equal_opportunity"`: `violation = abs(TPR_0 - TPR_1)`
   - If `mitigation_mode == "equalized_odds"`: `violation = abs(TPR_0 - TPR_1) + abs(FPR_0 - FPR_1)`
4. Compute the Loss Score:
   `total_loss = (FP_0 + FP_1) * loss_ratio + (FN_0 + FN_1)`
5. Pick the `(t0, t1)` pair where `violation < tolerance` AND `total_loss` is minimized.
6. Return the group-specific thresholds and the newly predicted labels.

**Output Specification:**
Returns a dictionary:
```python
{
    "threshold_group0": float,        # Optimal threshold for group 0
    "threshold_group1": float,        # Optimal threshold for group 1
    "y_pred_fair": np.ndarray,        # Fair predictions using group thresholds
    "post_mitigation_tpr_diff": float, # TPR difference after mitigation
    "post_mitigation_fpr_diff": float, # FPR difference after mitigation
    "total_loss": float,              # Minimized loss at optimal thresholds
    "mitigation_mode": str            # Mode used
}
```

## 4. Agent Coding Guidelines (Watch for bugs!)
- **Division by zero protection.** Groups with zero actual positives (`TP+FN == 0`) or zero actual negatives (`FP+TN == 0`) will cause division by zero in TPR/FPR. Guard every division with `if denominator > 0 else np.nan`.
- **Grid search efficiency.** The exhaustive grid over `(t0, t1)` is `O(n_grid_steps^2)`. Use vectorized numpy masking operations instead of nested Python for-loops. Pre-compute cumulative TP/FP counts via sorted score arrays for O(1) per threshold evaluation.
- **No valid pair found.** If no `(t0, t1)` satisfies `violation < tolerance`, return the pair with the minimum violation and warn the user that strict fairness is infeasible at the current tolerance.
- **Score calibration.** If raw model outputs are not probabilities (e.g., SVM margins), normalize them to [0, 1] using `min-max` scaling before threshold search.
