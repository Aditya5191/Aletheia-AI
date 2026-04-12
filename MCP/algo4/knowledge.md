# Algorithm 4: Intersectional Subgroup Scan for Fairness

## 1. Objective
Discover, validate, and mitigate algorithmic fairness violations targeting extremely specific intersectional subgroups (e.g., young, low-income minority individuals), circumventing the combinatorial explosion problem by iteratively optimizing a violation score relative to a global baseline. Traditional top-level parity checks often mask severe disparities hidden deep within these intersections.

## 2. Detection (Subgroup Matrix Scanning)
Scans distinct intersectional populations, formally testing if predictability metrics deviate significantly outside statistically safe boundaries relative to the general population.

**Mathematical Foundation:**
- **Subgroup (S):** Conjunctions of protected attributes (e.g. `(Race=Minority) AND (Age<30)`)
- **Violation Margin:** `V(S) = abs(metric(S) - metric(global)) / sqrt(N_subgroup)`
- **Bound Check:** Employs Hoeffding/Bernstein bounds guarding against false discoveries across massive combinatorial sweeps. Small groups must have vastly larger metric variations to be ruled statistically significant over noise.

**Inputs Required:**
- `X_protected`: A dataframe/matrix exclusively holding categorically distinct attribute groups (race, gender, age tiers, etc.).
- `y_true`: Authentic labels.
- `y_pred`: Raw model guesses.
- `min_support_frac`: Required fractional size of the original dataset for an intersection cluster to be validated (Default 0.02).

**Pseudo-code Implementation:**
1. Derive `global_baseline_metric` representing your primary fairness metric (e.g., Positive Selection Rate or FPR) calculated cleanly across the entire scope of the dataset.
2. Initiate a search starting broadly over the entire matrix footprint (depth = 0).
3. Recursively split paths matching node traits based exclusively upon iterating every valid unique column combination inside `X_protected`.
4. Validate each split path strictly:
   a. Terminate recursion if the local cluster size falls beneath `min_support_frac`.
   b. Calculate the isolated child subgroup's localized metric rate.
   c. Derive violation metric `V(S)` using the math foundation above to inherently penalize small noisy splits.
   d. Secure statistical validity calculating Standard Error distributions. If a simple Z-Test p-value falls strictly below Alpha (0.05), save the clustered subgroup dictionary matrix as a discovery.
5. Organize discoveries sorting valid subgroup clusters descending by their explicitly calculated `Violation Margin` size.

## 3. Mitigation (Intersectional Targeting)
Adjust models correcting ONLY subgroups discovered failing statistical safety bounds from the detection phase directly—without blindly perturbing their safe, un-flagged sibling counterparts.

**Inputs Required:**
- `y_pred_scores`: Unedited continuous decision predictions (0.0 to 1.0).
- `subgroups`: Discoveries extracted uniformly from the Detection Phase.
- `mitigation_type`: String. "threshold" or "reweight".

**Pseudo-code Implementation:**
1. Extract subgroup matrices descending from highest priority violation scores cleanly.
2. Deduce required intervention direction: `direction = sign(global_baseline - subgroup_rate)`.
3. Apply localized offset mapping directly targeting indices strictly encapsulated inside the boolean cluster path definitions.
   - **If Thresholding (`mitigation_type == 'threshold'`):**
     Shift subgroup probability outcomes directly: `offset = direction * violation_score * sqrt(cluster_size) * mitigation_strength`. Add this linear offset only to the exact predictions of individuals mapped inside the violating subgroup.
   - **If Reweighting (`mitigation_type == 'reweight'`):**
     Instruct underlying training frameworks to emphasize sample gradients locally on re-runs: `weight = 1.0 + (direction * violation_score * mitigation_strength)`. Clip weights logically to `[0.5, 2.0]` bounds preventing exponential gradient instability.
4. Finalize predictions firmly adhering to standard probability `[0.0, 1.0]` clamps preventing extreme integer corruptions.

## 4. Agent Coding Guidelines (Watch for bugs!)
- Data pipelines passed to `X_protected` must be cleanly tokenized categorically. Continuous integers defining age gradients will crash subset unique lookups natively causing recursive overflow.
- Do NOT run exhaustive permutations recursively mapping arrays wildly; rely cleanly on executing boolean masks (like `mask & (X['col'] == val)`) enforcing array memory limits strictly under Python environments.
- Handle mathematical `NaN` propagation carefully inside Standard Error definitions resulting cleanly from division-by-zero behaviors in extremely deep, hyper-sparse attribute conjunction splits.
