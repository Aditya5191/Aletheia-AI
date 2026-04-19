# Algorithm 6: Brownian Distance Covariance (dCor) Scanning

## 1. Objective
Rigorously detect and quantify completely arbitrary statistical dependence between features and protected attributes without assuming linearity. Standard Pearson correlations fail against U-shaped, threshold, or other non-linear proxy relationships. Distance Covariance (dCor) captures all forms of statistical dependence, where `dCor = 0` if and only if the variables are truly statistically independent.

## 2. Detection (Distance Matrix Scanning)
Scans every feature, converts value arrays into pairwise distance matrices, double-centers them, and computes dCor to detect any form of proxy dependence on the protected attribute.

**Mathematical Foundation:**
- **Pairwise Distance Matrix:** `a_kl = ||X_k - X_l||` (Euclidean distance between all pairs).
- **Double Centering:** `A_kl = a_kl - row_mean_k - col_mean_l + global_mean`. Removes marginal effects to isolate dependence structure.
- **Distance Covariance:** `dCov^2(X, Y) = mean(A * B)` where `A` and `B` are double-centered distance matrices of `X` and `Y`.
- **Distance Correlation:** `dCor = sqrt(dCov^2(X, Y) / (sqrt(dCov^2(X, X)) * sqrt(dCov^2(Y, Y))))`. Bounded in [0, 1]. Equals 0 if and only if X and Y are independent.
- **Significance Test:** Permutation-based null distribution with Benjamini-Hochberg FDR correction.

**Inputs Required:**
- `X`: numpy array or DataFrame. Feature matrix. Shape (n_samples, n_features).
- `protected_attr`: numpy array. Single vector of the protected attribute. Shape (n_samples,).
- `n_perms`: Integer. Number of permutation iterations for null-distribution testing. Default: 300.
- `alpha`: Float. FDR significance level. Default: 0.05.
- `max_rows`: Integer. Maximum dataset rows before triggering a memory warning. Default: 30000.

**Default Parameter Tuning Guide:**
- `n_perms`: Use 300 for standard audits. Increase to 1000 for publication-grade results. Decrease to 100 for quick exploratory scans. Each permutation requires full distance matrix recomputation, so time scales linearly with `n_perms`.
- `alpha`: Use 0.05 for standard significance. Tighten to 0.01 for conservative audits with many features (reduces false discoveries). Widen to 0.10 only for exploratory screening.
- `max_rows`: Distance matrices are O(N^2) in memory. At 30,000 rows, a single distance matrix occupies ~7.2 GB. For datasets exceeding this, subsample randomly before computing.

**Pseudo-code Implementation:**
1. Standardize all features in `X` and `protected_attr` to zero mean, unit variance.
2. Compute the distance matrix of `protected_attr`: `dist_prot = pdist(protected_attr.reshape(-1, 1))`. Convert to squareform. Double-center it to get matrix `B`.
3. For each feature column `j` in `X`:
   a. Compute distance matrix: `dist_feat = pdist(X[:, j].reshape(-1, 1))`. Convert to squareform.
   b. Double-center to get matrix `A`.
   c. Compute `dCov_sq = mean(A * B)`.
   d. Compute `dVar_X = mean(A * A)` and `dVar_Y = mean(B * B)`.
   e. Compute `dCor = sqrt(dCov_sq / (sqrt(dVar_X) * sqrt(dVar_Y)))` if denominator > 0, else 0.
4. Permutation significance test for each feature:
   a. Repeat `n_perms` times: shuffle `protected_attr`, recompute `B_perm`, compute `dCor_perm`.
   b. `p_value = (count(dCor_perm >= dCor_observed) + 1) / (n_perms + 1)`.
5. Apply Benjamini-Hochberg FDR correction:
   a. Sort p-values ascending. For rank `i` out of `m` features: `adjusted_p[i] = p[i] * m / i`.
   b. Flag feature as proxy if `adjusted_p < alpha`.

**Output Specification:**
Returns a dictionary:
```python
{
    "feature_results": [
        {
            "feature_name": str,
            "dcor": float,              # Distance correlation value
            "p_value": float,           # Raw permutation p-value
            "adjusted_p_value": float,  # BH-corrected p-value
            "is_proxy": bool            # True if adjusted_p < alpha
        }
    ],
    "n_proxies_detected": int,          # Total flagged features
    "alpha_used": float,                # FDR level applied
    "n_perms_used": int                 # Permutations run
}
```

## 3. Mitigation (Non-linear Residualization)
Sever the detected non-linear dependencies by regressing out the protected attribute's influence from each flagged feature, replacing the original with the independent residual.

**Inputs Required:**
- `flagged_features`: List of strings or indices. Features identified as proxies by detection.
- `protected_attr`: numpy array. Protected attribute vector. Shape (n_samples,).
- `X`: numpy array or DataFrame. Original dataset. Shape (n_samples, n_features).
- `regressor_type`: String. Type of non-linear regressor. Default: "gradient_boosting". Options: "gradient_boosting", "random_forest", "kernel_ridge".

**Default Parameter Tuning Guide:**
- `regressor_type`: Use "gradient_boosting" for best non-linear proxy capture. Use "random_forest" if interpretability of the proxy relationship matters. Use "kernel_ridge" only for small datasets (< 5,000 rows) where kernel methods are tractable.

**Pseudo-code Implementation:**
1. For each feature in `flagged_features`:
   a. Record the original standard deviation: `original_std = std(X[:, feature])`.
   b. Fit a non-linear regressor (e.g., GradientBoostingRegressor) predicting `X[:, feature]` from `protected_attr`.
   c. Generate predictions: `predicted = regressor.predict(protected_attr)`.
   d. Compute residual: `residual = X[:, feature] - predicted`.
   e. Rescale residual to match original variance: `residual_scaled = residual * (original_std / std(residual))` if `std(residual) > 0`.
   f. Replace the original feature column with `residual_scaled`.
2. Return the repaired dataset.

**Output Specification:**
Returns a dictionary:
```python
{
    "X_repaired": np.ndarray,           # Repaired feature matrix
    "features_repaired": list,          # Names/indices of features repaired
    "pre_repair_dcor": dict,            # dCor values before repair
    "post_repair_dcor": dict,           # dCor values after repair (optional validation)
    "regressor_type_used": str          # Regressor applied
}
```

## 4. Agent Coding Guidelines (Watch for bugs!)
- **O(N^2) memory constraint.** `scipy.spatial.distance.pdist` produces `N*(N-1)/2` pairwise distances. At 30,000 rows this is ~450M entries. Always check `n_samples` before computing and warn the user if it exceeds `max_rows`. Subsample to 10,000-20,000 rows if needed.
- **Division by zero in dCor.** If `dVar_X` or `dVar_Y` is zero (constant feature or constant protected attribute), `dCor` denominator is zero. Guard with `if denom > 1e-10 else 0.0`.
- **Permutation variable isolation.** When shuffling `protected_attr` for permutation tests, always use `rng.permutation(protected_attr.copy())` to avoid mutating the original array. Create a fresh copy each iteration.
- **BH correction monotonicity.** After computing adjusted p-values via Benjamini-Hochberg, enforce monotonicity by walking backwards: `adjusted_p[i] = min(adjusted_p[i], adjusted_p[i+1])`.
