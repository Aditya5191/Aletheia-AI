# Algorithm 5: Mutual Information-Theoretic Proxy Scanning

## 1. Objective
Identify, quantify, and surgically remove complex, non-linear proxy dependencies (leakage) in high-dimensional datasets where non-sensitive features inadvertently encode protected attributes (like using ZIP Code as a proxy for Race). This aggressively bypasses the severe limitations of simple linear correlations.

## 2. Detection (MI Estimation & FDR Scanning)
Scans every feature evaluating its dependency strength on the protected class using a highly robust k-Nearest Neighbor (k-NN) Mutual Information estimator, guaranteeing statistical significance via automated permutation tests.

**Mathematical Foundation:**
- **Information Estimation:** Measures predictability boundaries. Higher MI native metrics reflect overwhelmingly stronger leakage pathways.
- **KSG k-NN Estimator:** `I(X; A) ≈ ψ(N) - <ψ(nx+1) + ψ(ny+1)> + ψ(k)`. Uses explicit nearest-neighbor radius boundaries to estimate localized continuous probability density natively without arbitrary array binning forcing data loss.
- **FDR Correction:** Employs the Benjamini-Hochberg formal procedure sorting p-value thresholds specifically preventing massive false-positive discoveries in high-dimensional datasets.

**Inputs Required:**
- `X`: Data matrix of raw features.
- `protected_attr`: Single vector isolating the protected attribute explicitly.
- `k`: KSG k-NN radius bounds (default 3).
- `n_perms`: Loop iterations for null-distribution testing (default 200).

**Pseudo-code Implementation:**
1. Isolate the list array executing distinctly over `n_features`.
2. Compute Observed Mutual Information using a standard unsupervised topological KSG KD-Tree mapping local neighborhood occurrences per feature.
3. Validate Significance via Active Permutations:
   a. Loop through sequential `n_perms` safely shuffling the entire `protected_attr`.
   b. Recompute localized chanced-MI mapped directly against the blinded `protected_attr`.
   c. P-Value directly isolates the pure mathematical fraction computing average occurrences where chanced MI >= Observed MI.
4. Scale P-Values explicitly correcting bounds using the exact mathematical sorting behavior of Benjamini-Hochberg preventing compounding hypothesis inflation.
5. Flag discovery securely if `adjusted_p < 0.05` AND the continuous `mi_score` breaches a defined non-zero minimum bounding.

## 3. Mitigation (Conditional Residualization)
Sever the proxy leak directly by mathematically regressing the flagged proxy feature entirely mapping against the protected attribute class, and actively extracting only the unexplainable random mathematical error (Residual) to feed into the baseline classifier model rather than deploying the raw proxy feature itself natively.

**Inputs Required:**
- `proxy_features`: List heavily flagged by detection phase limits.
- `protected_attr`: Array vector defining class distributions.
- `X`: Original unedited dataset structures.

**Pseudo-code Implementation:**
1. Parse over strictly each highlighted proxy defining its exact continuous feature array `x_feat`.
2. Secure mathematical variance constants natively mapping baseline statistics (`original_std`, `original_mean`) isolating variance scaling preservation ensuring downstream classifiers aren't fundamentally destroyed predicting shifted tensors.
3. Fit an intermediary predictor model mathematically structurally mapping Gradient Boosting or generic Ridge Linear models dynamically injecting `protected_attr` as `X` directly pointing targets at estimating `x_feat` as `y`.
4. Deploy the fitted model natively predicting mathematically what it expects the feature mapping bounds to reflect implicitly.
5. Compute the clean statistical error margin actively: `residual = x_feat - predicted`.
6. Restore mathematical scaling normalizing exact residual vectors conforming ranges completely mapping natively back replacing vectors into `original_std`.
7. Overwrite baseline instances entirely inside `X[:, feature]` deploying the normalized clean residual vectors conclusively executing pure structural independence safely.

## 4. Agent Coding Guidelines (Watch for bugs!)
- Scipy `cKDTree` structures enforce continuous memory formatting aggressively natively. Watch integer casting errors when running distance operations globally.
- Aggressively force raw computations clamping MI outputs completely securely ensuring mathematical stability limits never output arbitrary negations (`max(0.0, mi)`).
- Ensure null-permutations securely branch copies of variables locally preserving safe independence iterations across testing arrays preventing python memory corruption referencing.
