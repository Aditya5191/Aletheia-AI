# Algorithm 1: Certifying and Removing Disparate Impact

## 1. Objective
Detect and remove disparate impact (bias) in algorithmic systems via data pre-processing. This allows organizations to certify fairness without requiring access to proprietary, black-box classifiers. It relies on the U.S. legal framework of the 80% rule.

## 2. Detection (Certification Algorithm)
Determines whether a dataset admits disparate impact by checking if the protected attribute is predictable from the remaining features.

**Mathematical Foundation:**
- If no classifier can predict the protected attribute with a Balanced Error Rate (BER) smaller than a threshold epsilon, then the dataset is certified safe from disparate impact.
- **BER Formula:** `BER = (FPR + FNR) / 2` where `FPR = FP / (FP + TN)` and `FNR = FN / (FN + TP)`.
- **Epsilon Threshold:** `epsilon = 0.5 - beta * (1/tau - 1) / 2` where `beta = P(C=1 | X=0)` is the minority selection rate.

**Inputs Required:**
- `X`: numpy array. Binary protected attribute (0=minority, 1=majority). Shape (n_samples,).
- `Y`: numpy array or DataFrame. Feature matrix excluding the protected attribute. Shape (n_samples, n_features).
- `C`: numpy array. Binary decision outcome labels (1=hire/approve, 0=reject). Shape (n_samples,).
- `tau`: Float. Disparate impact threshold from the 80% rule. Default: 0.8.
- `classifier`: String. Type of classifier to use for BER estimation. Default: "logistic_regression". Options: "logistic_regression", "svm", "random_forest".

**Default Parameter Tuning Guide:**
- `tau`: Use 0.8 for standard U.S. legal compliance (80% rule). Use 0.9 for stricter auditing. Never go below 0.7 as it weakens the certification guarantee.
- `classifier`: Use "logistic_regression" for speed and interpretability. Use "random_forest" if non-linear proxies are suspected. Use "svm" only on datasets < 10,000 rows due to O(N^2) scaling.

**Pseudo-code Implementation:**
1. Compute the minority selection rate: `beta = mean(C[X == 0] == 1)`.
2. Calculate the BER boundary: `epsilon_threshold = 0.5 - beta * (1/tau - 1) / 2`.
3. Select classifier with balanced class weights. Train it using `Y` as features to predict `X` as target.
4. Run predictions on a held-out set or via cross-validation.
5. Calculate BER: `BER = (FalsePositiveRate + FalseNegativeRate) / 2`.
6. Evaluate: If `BER >= epsilon_threshold`, the dataset is "Certified Fair".

**Output Specification:**
Returns a dictionary:
```python
{
    "ber": float,                    # Balanced Error Rate achieved by classifier
    "epsilon_threshold": float,      # BER threshold for certification
    "is_certified_fair": bool,       # True if BER >= epsilon_threshold
    "minority_selection_rate": float, # beta value
    "tau": float,                    # Threshold used
    "classifier_used": str           # Which classifier was applied
}
```

## 3. Mitigation (Geometric Repair Algorithm)
Transforms the feature matrix `Y` into `Y_repaired` so the protected attribute `X` becomes statistically unpredictable, explicitly mirroring distributions while preserving intra-group candidate ranking.

**Inputs Required:**
- `Y`: numpy array. Numerical feature matrix. Shape (n_samples, n_features).
- `X`: numpy array. Protected attribute vector. Shape (n_samples,).
- `repair_level`: Float in [0, 1]. 0 = no repair, 1 = full uniform alignment. Default: 1.0.

**Default Parameter Tuning Guide:**
- `repair_level`: Use 1.0 for full fairness enforcement. Use 0.5-0.8 for a balance between fairness and utility preservation. Use 0.0 only for baseline comparison (no repair applied). Start at 1.0 and reduce only if downstream model accuracy drops unacceptably.

**Pseudo-code Implementation:**
For every individual column (feature) in `Y`:
1. Split the feature data based on group `X=0` and `X=1`.
2. Compute the Empirical CDF for group 0, mapping values to quantiles. Compute its inverse CDF mapping quantiles back to values.
3. Compute the Empirical CDF for group 1. Compute its inverse CDF.
4. Calculate a unified "Median Distribution" mapping each quantile step (0 to 1) to the median of group 0 and group 1 values at that exact quantile.
5. Apply the repair loop row by row:
   a. Capture original value `y` and its group label `x`.
   b. Identify `y`'s quantile rank within its own group CDF.
   c. Look up that quantile rank in the Median Distribution to get `y_full_repair`.
   d. Assign the final value via geometric interpolation:
      `y_repaired = (1 - repair_level) * y_original + repair_level * y_full_repair`

**Output Specification:**
Returns a dictionary:
```python
{
    "Y_repaired": np.ndarray,        # Repaired feature matrix, same shape as Y
    "repair_level": float,           # Lambda value applied
    "n_features_repaired": int,      # Number of columns processed
    "post_repair_ber": float         # Optional: BER after repair (re-run detection)
}
```

## 4. Agent Coding Guidelines (Watch for bugs!)
- **Numeric features only.** This approach only handles numeric/ordinal arrays. Categorical columns must be label-encoded before repair. Inform the user if non-numeric columns are detected.
- **CDF boundary clipping.** When computing empirical CDF values, clip outputs to `[1e-6, 1 - 1e-6]` to prevent `inf` values during inverse CDF interpolation at the exact boundaries of 0.0 and 1.0.
- **Quantile alignment precision.** Use `numpy.interp` for CDF/inverse-CDF lookups. Avoid manual loop-based interpolation as it introduces floating point drift on large datasets.
- **Memory efficiency.** Process columns one at a time rather than constructing full CDF matrices for all features simultaneously.
