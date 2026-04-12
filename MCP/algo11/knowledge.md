# Algorithm 11: Causal Explanation Formula (Mechanism Decomposition)

## 1. Objective
Achieve granular fairness interventions by isolating and splitting blunt historical statistics (`Total Variation`) into rigorous mathematical components: Direct algorithmic discrimination (`DE`), Indirect structural mediation (`IE`), and pure historical Spurious redlining/confounding (`SE`). This allows models to target exact pathways legally through "Narrow Tailoring."

## 2. Detection (Mechanistic Isolation)
Mathematically isolates exact percentage likelihoods allocating disparity tracking causal counterfactual probabilities.

**Mathematical Foundation:**
- **Causal Formula:** `TV = SE + IE - DE`
- **Total Variation (TV):** Base observed outcome disparity `[P(y|x1) - P(y|x0)]` natively mapped.
- **Counterfactual Direct Effect (Ctf-DE):** Measures exact penalty tracking `[P(outcome|x1, mediators) - P(outcome|x0, mediators)]`.
- **Counterfactual Spurious Effect (Ctf-SE):** Measures pure historical backdoor bias.

**Inputs Required:**
- `data`: Master array dataframe.
- `X_col`: String defining sensitive attribute.
- `W_cols`: List matching defined structural mediators natively.
- `Z_cols`: List matching historical confounders natively.
- `Y_col`: Output target array.

**Pseudo-code Implementation:**
1. Regress exactly tracking probability models mapping `LogisticRegression`:
   - Compute probabilities mapping cleanly matching `P(Y | X, W, Z)` structurally correctly.
   - Compute exactly targeting mediators matching `P(W | X, Z)`.
   - Calculate exact empirical tracking bounds securely `P(Z | X)`.
2. Extract targeted computational loops mapping probabilistic causal impacts via sums:
   - Loop over values of `Z` extracting conditional probabilities natively.
   - Extract Direct Effects mathematically generating `Ctf_DE`.
   - Extract Interstitial Spurious elements structuring `Ctf_SE`.
   - Calculate Mediating influences tracking `Ctf_IE`.
3. Verify exactly matching structurally clean decomposition natively tracking identical variables `abs(TV - (SE + IE - DE))` extracting precise attribution percentages.

## 3. Mitigation (Narrow Tailoring Optimization)
Mathematically enforces "Narrow Tailoring" executing reparatory Affirmative Action securely blocking mathematically boundaries that execute "Reverse Discrimination" dynamics.

**Mathematical Foundation:**
- **Feasibility Limits:** `abs(Residual - DE_new) <= abs(Total_Variation)`
- **Safety Zone:** Explicitly bounds `DE_new` safely inside bounds `[0, Residual(SE + IE)]`.

**Inputs Required:**
- `TV_orig`: Stated original total limit calculation.
- `Ctf_SE`, `Ctf_DE`, `Ctf_IE`: Mapped decomposition exact variables.
- `policy_type`: String explicitly targeting `disable_direct` or `affirmative_action`.

**Pseudo-code Implementation:**
1. Formulate mathematically bounds strictly successfully tracking explicit structural metrics calculating exact residual baseline safely: `Residual = Ctf_SE + Ctf_IE`.
2. Generate actively safety boundaries dependably tracking legal limits explicitly:
   - Identify Narrow Tailoring limits calculating `feasible_lower = Residual - abs(TV_orig)`.
   - Identify explicitly limits calculating `feasible_upper = Residual + abs(TV_orig)`.
   - Bind legal boundaries targeting constraints explicitly safely: `[max(0, feasible_lower), min(Residual, feasible_upper)]`.
3. Verify mathematically and execute policy reliably efficiently:
   - If `disable_direct`: Force intelligently `DE_new = 0` explicitly limiting calculations returning `Residual` as the updated disparity.
   - If `affirmative_action`: Calculate explicitly smoothly targeted affirmative constraints securely mapping `optimal_DE = clamp(Residual, legal_lower, legal_upper)`.
4. Export functionally mathematically reliable dictionaries highlighting explicitly exact mitigation statistics safely generating reports.

## 4. Agent Coding Guidelines (Watch for bugs!)
- Computations heavily rely on `expit` targeting logistic outputs cleanly mathematically safely protecting limits explicitly. Never run raw matrix multiplications tracking classifications targeting bounds without wrapping `expit(intercept + coef @ variables)`.
- Summation loops over variables generate nested permutations mathematically cleanly securely explicitly cleanly. Use vector math safely cleanly intelligently where available tracking purely mathematical limits safely gracefully safely smoothly smoothly tracking precisely.
- Always check variable names elegantly safely cleanly accurately natively tracking smoothly efficiently correctly matching columns mapping explicitly expertly safely safely identically appropriately identically.
