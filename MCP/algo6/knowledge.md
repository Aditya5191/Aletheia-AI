# Algorithm 6: Brownian Distance Covariance (dCor) Scanning

## 1. Objective
Rigorously detect and quantify completely arbitrary statistical dependence pathways between features and protected attributes without assuming linear behaviors, circumventing the massive blind spots inside standard Pearson correlations that fail against U-shaped or complex threshold bounds.

## 2. Detection (Distance Matrix Scanning)
Scans every individual feature converting spaces into distance matrices, double-centering them to compute purely bounded `dCor` continuous signals natively defining independence mathematically explicitly.

**Mathematical Foundation:**
- **Distance Matrix (a_kl):** `||X_k - X_l||`
- **Double Centering (A_kl):** `a_kl - row_mean - col_mean + global_mean`
- **Distance Covariance / dCor:** `mean(A * B)` divided heavily by explicit variance boundaries. `dCor=0` fundamentally natively equates exactly to pure statistical independence.
- **Significance Test:** Permutations breaking null-hypotheses actively with Benjamini-Hochberg error bounds (FDR control).

**Inputs Required:**
- `X`: Data matrix of raw features.
- `protected_attr`: Single vector isolating the protected attribute explicitly.
- `n_perms`: Loop iterations mapping native null-distribution testing (default 300).

**Pseudo-code Implementation:**
1. Hard standardizations: Scale `X` array variables and `protected_attr` cleanly targeting unit variance exclusively avoiding computational precision drift.
2. Isolate the protected vector structurally deriving its explicit distance matrix mapping limits (e.g. `scipy.spatial.distance.pdist`) and formally `double_center()` it to expose array `B`.
3. Loop over features explicitly mapping:
   a. Compute distance tensor tracking `A = double_center(pdist(x_std))`.
   b. Calculate pure distance covariance `d_cov = mean(A * B)`.
   c. Calculate scaling denominator bounding the matrix explicitly ensuring mapping bounds scale continuously `[0, 1]`.
4. Validate Significance via Active Permutations:
   a. Shuffle `protected_attr` variables massively natively.
   b. Recompute `B_perm`.
   c. Derive isolated permuted `dCor` tracking matrices scoring explicitly mapped against the observed base variant limits.
5. Compute analytical FDR threshold bounds sorting P-values dynamically checking structural scaling limits and flag exclusively if `adj_p < 0.05`.

## 3. Mitigation (Non-linear Residualization)
Sever the explicitly detailed non-linear matrix dependencies derived strictly from the correlation testing scan. Regress predictive non-linear dependence capacities from the protected class cleanly, extracting structural noise variables exclusively ensuring predictive algorithms aren't stripped natively.

**Inputs Required:**
- `flagged_features`: Extracted target lists tracking pure discoveries.
- `protected_attr`: True variable class arrays dictating regression targets.
- `X`: Original unedited dataset boundaries.

**Pseudo-code Implementation:**
1. Loop cleanly isolating column instances explicitly flagged tracking highest discovery limits.
2. Store native variance parameters mapping limits identically to `original_std` guaranteeing stability parameters survive.
3. Fit dynamic predictor objects explicitly aiming at extreme non-linear pathways (typically Gradient Boosting Regressors) forcing predictors to target proxy dependence natively.
4. Export mapping arrays generating predictions simulating mathematical dependence cleanly.
5. Identify isolated structural margins actively deriving clear independent metrics: `residual = x_feat - predicted`.
6. Reinstate scaling parameters mathematically returning variance bounds securing stability identical over `original_std`.
7. Hard-swap structural targets globally rewriting matrices deploying exclusively the continuous independent outputs.

## 4. Agent Coding Guidelines (Watch for bugs!)
- Algorithms targeting `pdist` execute purely upon bounds scaling $O(N^2)$ inside continuous memory! Aggressively track memory capacity arrays heavily monitoring execution blocks preventing application crashes on matrices $>30k$ rows.
- Securely execute boundary checks specifically protecting array scaling limits passing completely gracefully where `denom == 0` preventing cascading computation bounds failing from `NaN`.
- Strict Pythonic isolation applies securely over loops iterating null-permutation boundary arrays structurally preventing variable bleed cross-talk referencing identically.
