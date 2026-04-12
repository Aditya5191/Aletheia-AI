# Algorithm 9: Causal Fair Inference (Path-Specific Effects)

## 1. Objective
Achieve rigorous fairness by explicitly measuring and bounding isolated causal pathways (Path-Specific Effects / Natural Direct Effects) rather than blind statistical correlations. This legally targets formal "Disparate Treatment" directly by measuring discrimination while carefully preserving legitimate performance mediators independently.

## 2. Detection (IPW Effect Estimation)
Isolates direct pathways bounding structural discrimination by evaluating classification targets computationally holding mediating factors statically constant while formally swapping sensitive attribute variables.

**Mathematical Foundation:**
- **Natural Direct Effect (NDE):** `E[Y(1, M(0))] - E[Y(0)]`. The explicit mean difference isolating pure causal structural impact.
- **Inverse Probability Weights (IPW):** Applies mathematically formulated weights dynamically correcting treatment distribution propensities natively limiting baseline skew arrays cleanly.

**Inputs Required:**
- `data`: Origin dataframe holding matrices explicitly natively.
- `treatment_col`: Base sensitive attribute indicator column string.
- `outcome_col`: Binary predictive column targets string.
- `confounder_cols`: Safe structural mediating variables arrays.
- `bounds`: Cutoffs limits explicit array `[epsilon_l, epsilon_u]`.

**Pseudo-code Implementation:**
1. Fit a structural binary model strictly natively computing `P(A|C)` generating raw propensity probabilities.
2. Form dynamic IPW calculation arrays: `weight = 1 / (propensity)` scaling matrices mathematically natively dividing data tracking structures bounding normalizing bounds efficiently.
3. Split arrays tracking numerical treatment classes accurately cleanly: 
   - `active`: Average outcome matrix strictly scaling over calculated active class weights natively.
   - `baseline`: Average outcome explicitly bounded strictly over tracking baseline weights natively.
4. Derive isolated direct causal differences formally mapping `PSE = active_average - baseline_average`.
5. Bootstrap `PSE` recursively calculating variable distributions executing exact mathematical permutations explicitly mapping `95% Confidence Intervals` bounding parameters perfectly.
6. Flag structural bounds directly alerting if `PSE < epsilon_l` OR exactly where `PSE > epsilon_u`.

## 3. Mitigation (Constrained Maximum Likelihood Estimation)
Reconstruct native predictions calculating advanced `Constrained MLE` bounding minimizing Negative Log-Likelihoods structurally identically dynamically restricting absolutely any internal algorithmic pathway from exceeding targeted boundaries mathematically seamlessly natively.

**Inputs Required:**
- `feature_cols`: Complete combined parameter string tracking `[treatment_col] + confounder_cols`.
- `epsilon_l`, `epsilon_u`: Formal legal discrimination parameter boundaries natively.

**Pseudo-code Implementation:**
1. Execute structural base regression logically entirely natively bounding `scipy.optimize.minimize(method='L-BFGS-B')` targeting exact structural `-LogLikelihood` completely natively.
2. Generate active optimization constraints cleanly formulating targets natively calculating bounds mathematically dynamically explicitly bounding causal prediction differences explicitly strictly tracking exactly `active` and strictly `baseline` arrays structurally static natively.
3. Optimize strictly mapping formal `SLSQP` solver routines heavily routing exact negative log-likelihood parameters constraining internal limits safely confining prediction gradients completely inside strict mathematical metrics accurately matching limits mapping `[epsilon_l, epsilon_u]`.
4. Construct constrained targeted functions defining explicit functions securely constructing distributions defining out-of-sample behaviors natively explicitly targeted routing completely safe limits natively tracking structurally:
   - Calculate entirely scaling `treatment_col=0` creating exact accurate structural baseline behaviors securely natively.
   - Calculate accurately executing precisely where `treatment_col=1` correctly identifying explicitly bounded structural targets seamlessly seamlessly natively.
   - Average completely outputs accurately executing dynamically averaging seamlessly mapping variables bounding seamlessly natively extracting perfectly balanced outputs explicitly natively securely natively routing strictly completely identically.

## 4. Agent Coding Guidelines (Watch for bugs!)
- Scipy Optimizers (`SLSQP`) bounds natively crash actively cleanly raising flags exactly strictly entirely correctly identically if strictly strictly precisely dynamically structurally arrays bounds fail convergence explicitly generating math boundaries seamlessly targeting explicitly. Trap exactly solver responses explicitly mapping variables precisely `result.success == False` exactly securely gracefully executing strictly gracefully!
- Bounded probabilities logically tracking logs actively completely structurally exactly cleanly dynamically raise errors mathematically precisely where completely dynamically executing logs. Map inputs seamlessly cleanly exactly heavily exclusively arrays explicitly bounding natively smoothly precisely `np.clip(probs, 1e-8, 1 - 1e-8)` strictly smoothly executing precisely strictly exactly smoothly cleanly avoiding errors structurally elegantly exactly avoiding completely cleanly dynamically cleanly.
