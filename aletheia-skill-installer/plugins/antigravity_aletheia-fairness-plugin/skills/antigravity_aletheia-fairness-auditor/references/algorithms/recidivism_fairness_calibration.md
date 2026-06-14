# Algorithm 3: Fair Prediction with Disparate Impact (Recidivism)

## 1. Objective
Provide a rigorous diagnostic framework proving that when base rates (prevalence of actual positives) differ across groups, achieving predictive parity (equal PPV) mathematically forces an imbalance in False Positive Rates (FPR) and False Negative Rates (FNR). This algorithm diagnoses these theoretically impossible trade-offs and calibrates thresholds to explicitly choose a compromise.

## 2. Detection (The Impossibility Theorem Framework)
Detect conflicting statistical metrics and compute the mathematical error gap forced by varying prevalence across demographic groups.

**Mathematical Foundation:**
- **Impossibility Equation (Eq. 2.6):** `FPR = (p / (1 - p)) * ((1 - PPV) / PPV) * (1 - FNR)`
  where `p` is the group prevalence. This proves that if PPV is equalized across groups with different base rates, FPR and FNR must differ.
- **Prevalence:** `p_k = P(Y=1 | group=k) = mean(y_true[group == k])`.
- **PPV (Positive Predictive Value):** `P(Y=1 | Predicted=1)`.
- **Penalty Disparity:** `Delta = (t_max - t_min) * (FPR_group0 - FPR_group1)` measures the cost disparity between groups.

**Inputs Required:**
- `scores`: numpy array. Continuous risk scores from the model. Shape (n_samples,).
- `y_true`: numpy array. Ground truth binary labels. Shape (n_samples,).
- `protected_attr`: numpy array. Group identifiers. Shape (n_samples,).
- `threshold`: Float. A single global threshold for baseline classification. Default: 0.5.
- `t_min`: Float. Minimum policy penalty weight. Default: 0.0.
- `t_max`: Float. Maximum policy penalty weight. Default: 1.0.
- `tolerance`: Float. Maximum acceptable metric difference for parity. Default: 0.05.

**Default Parameter Tuning Guide:**
- `threshold`: Use 0.5 for balanced datasets. If the dataset is heavily imbalanced (e.g., 5% positive rate), lower to 0.3 or use the prevalence-optimal threshold.
- `t_min` / `t_max`: These represent costof misclassification. In criminal justice, `t_max=10.0` reflects high cost of false positives (wrongful detention). In lending, `t_max=2.0` reflects moderate cost. Keep `t_min=0.0` unless a minimum penalty applies.
- `tolerance`: Use 0.05 for standard audits. Use 0.02 for strict compliance reporting.

**Pseudo-code Implementation:**
1. Split the data by each group in `protected_attr`.
2. For each group calculate:
   - Prevalence: `p = mean(y_true == 1)`
   - PPV: `P(Y=1 | score > threshold)` = `TP / (TP + FP)`
   - FPR: `FP / (FP + TN)`
   - FNR: `FN / (FN + TP)`
3. Validate parity directly:
   - `ppv_parity_violation = max(PPV_values) - min(PPV_values)`
   - `fpr_parity_violation = max(FPR_values) - min(FPR_values)`
4. Calculate Theoretical Penalty Disparity:
   `Delta = (t_max - t_min) * (FPR_group0 - FPR_group1)`
5. Verify Equation 2.6: For each group, compute theoretical FPR from observed PPV, prevalence, and FNR. Compare to actual FPR to confirm mathematical alignment.

**Output Specification:**
Returns a dictionary:
```python
{
    "group_metrics": {
        "group_0": {"prevalence": float, "ppv": float, "fpr": float, "fnr": float, "tpr": float},
        "group_1": {"prevalence": float, "ppv": float, "fpr": float, "fnr": float, "tpr": float}
    },
    "ppv_parity_violation": float,    # Max PPV difference across groups
    "fpr_parity_violation": float,    # Max FPR difference across groups
    "fnr_parity_violation": float,    # Max FNR difference across groups
    "penalty_disparity_delta": float, # Cost disparity between groups
    "impossibility_confirmed": bool,  # True if PPV parity forces FPR/FNR imbalance
    "eq_2_6_verified": bool           # True if theoretical FPR matches observed
}
```

## 3. Mitigation (Explicit Tradeoff Calibration)
By proving that simultaneous mathematical fairness is impossible, this calibration adjusts group-specific thresholds while explicitly relaxing constraints on one metric to guarantee fairness on another.

**Inputs Required:**
- `scores`: numpy array. Continuous risk scores. Shape (n_samples,).
- `y_true`: numpy array. Ground truth labels. Shape (n_samples,).
- `protected_attr`: numpy array. Group identifiers. Shape (n_samples,).
- `strategy`: String. Target optimization strategy. Default: "fpr_balance". Options: "fpr_balance", "fnr_balance", "ppv_parity".
- `n_grid_steps`: Integer. Number of candidate threshold percentiles. Default: 100.
- `ppv_limit`: Float. Maximum acceptable PPV deviation when not the primary target. Default: 0.10.

**Default Parameter Tuning Guide:**
- `strategy`: Use "fpr_balance" in criminal justice (equalizing false accusation rates). Use "fnr_balance" in medical screening (equalizing missed diagnoses). Use "ppv_parity" in lending (equalizing precision of approvals).
- `n_grid_steps`: Use 100 for standard. Use dataset distribution percentiles (5th through 95th of raw scores) for realistic cluster boundaries instead of uniform grids.
- `ppv_limit`: Use 0.10 for moderate flexibility. Tighten to 0.05 for strict PPV preservation.

**Pseudo-code Implementation:**
1. Map out percentiles (0 to 100) of the risk scores to serve as candidate thresholds.
2. Loop over candidate threshold pairs `(t0, t1)`:
3. Compute PPV, FPR, and FNR for group 0 at `t0`, and group 1 at `t1`.
4. Apply the routing logic dictated by the chosen `strategy`:
   - If `strategy == "fpr_balance"`:
     `cost = abs(FPR_0 - FPR_1) + max(0, abs(PPV_0 - PPV_1) - ppv_limit)`
   - If `strategy == "fnr_balance"`:
     `cost = abs(FNR_0 - FNR_1) + max(0, abs(PPV_0 - PPV_1) - ppv_limit)`
   - If `strategy == "ppv_parity"`:
     `cost = abs(PPV_0 - PPV_1) + 0.5 * (abs(FPR_0 - FPR_1) + abs(FNR_0 - FNR_1))`
5. Select the `(t0, t1)` pair that strictly minimizes the selected `cost`.
6. Enforce labels: `y_pred[group==0] = scores[group==0] >= t0`, `y_pred[group==1] = scores[group==1] >= t1`.

**Output Specification:**
Returns a dictionary:
```python
{
    "threshold_group0": float,        # Optimal threshold for group 0
    "threshold_group1": float,        # Optimal threshold for group 1
    "y_pred_calibrated": np.ndarray,  # Calibrated predictions
    "strategy_used": str,             # Strategy applied
    "post_calibration_metrics": {
        "ppv_diff": float,
        "fpr_diff": float,
        "fnr_diff": float
    },
    "minimized_cost": float           # Final cost value at optimal thresholds
}
```

## 4. Agent Coding Guidelines (Watch for bugs!)
- **Use percentile-based grids.** Calculate candidate thresholds from dataset distribution percentiles (5th through 95th of raw scores) instead of uniform 0-to-1 grids. This guarantees realistic decision boundaries that align with actual score clusters.
- **Pure label groups.** Groups where `prevalence == 0` (no positives) or `prevalence == 1` (no negatives) make PPV, FPR, and FNR undefined. Filter these groups and return `NaN` for their metrics instead of crashing.
- **Equation 2.6 validation.** After computing metrics, verify the impossibility equation holds. If `abs(theoretical_FPR - observed_FPR) > 0.01`, warn the user that the model may violate the assumed statistical structure.
- **Cost function edge cases.** When PPV denominators (TP + FP) are zero at a given threshold, set PPV to `NaN` and skip that threshold pair in the optimization.
