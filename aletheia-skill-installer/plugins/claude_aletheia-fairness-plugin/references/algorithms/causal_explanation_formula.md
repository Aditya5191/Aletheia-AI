# Algorithm 11: Causal Explanation Formula (Mechanism Decomposition)

## 1. Objective
Achieve granular fairness interventions by isolating and splitting blunt historical statistics (Total Variation) into rigorous mathematical components: Direct algorithmic discrimination (DE), Indirect structural mediation (IE), and pure historical Spurious confounding (SE). This allows models to target exact causal pathways through legally precise "Narrow Tailoring."

## 2. Detection (Mechanistic Isolation)
Mathematically isolates exact percentage contributions of each causal pathway to the observed disparity using counterfactual probabilities.

**Mathematical Foundation:**
- **Causal Decomposition Formula:** `TV = SE + IE - DE`
- **Total Variation (TV):** `P(Y=1 | X=x1) - P(Y=1 | X=x0)`. The raw observed outcome disparity.
- **Counterfactual Direct Effect (Ctf-DE):** The effect of changing the sensitive attribute while holding mediators at their natural values under the baseline group. Measures pure direct discrimination.
- **Counterfactual Indirect Effect (Ctf-IE):** The effect transmitted through mediators. Measures structural/institutional bias pathways.
- **Counterfactual Spurious Effect (Ctf-SE):** The effect due to confounders (historical redlining, systemic bias). Measures pure backdoor bias.

**Inputs Required:**
- `data`: pandas DataFrame. Master dataset containing all columns.
- `X_col`: String. Column name of the binary sensitive attribute (e.g., "race"). Must be binary (0 or 1).
- `W_cols`: List of strings. Column names of structural mediators (e.g., ["education", "experience"]). These are variables causally affected by X that also affect Y.
- `Z_cols`: List of strings. Column names of historical confounders (e.g., ["neighborhood", "parental_income"]). These are common causes of both X and Y.
- `Y_col`: String. Column name of the binary outcome (e.g., "hired").

**Pseudo-code Implementation:**
1. Fit three logistic regression models:
   a. **Outcome model:** `P(Y=1 | X, W, Z)` using all variables as features.
   b. **Mediator model:** For each mediator in `W_cols`, fit `P(W | X, Z)`.
   c. **Confounder distribution:** Estimate `P(Z | X)` from empirical conditional frequencies.
2. Compute Total Variation:
   `TV = mean(Y[X == 1]) - mean(Y[X == 0])`
3. Compute counterfactual effects by looping over confounder values:
   a. For each unique combination of Z values:
      - Compute `P(Y=1 | X=x1, W, Z)` and `P(Y=1 | X=x0, W, Z)` using the outcome model.
      - Weight by `P(Z | X=x0)` and `P(Z | X=x1)`.
   b. **Ctf_DE:** Sum over Z of `[P(Y|x1, W(x0), Z) - P(Y|x0, W(x0), Z)] * P(Z|x0)`.
   c. **Ctf_SE:** Sum over Z of `[P(Y|x0, W(x0), Z) * (P(Z|x1) - P(Z|x0))]`.
   d. **Ctf_IE:** Derive from `TV = SE + IE - DE`, so `IE = TV - SE + DE`.
4. Verify decomposition: Check that `abs(TV - (Ctf_SE + Ctf_IE - Ctf_DE)) < 0.001`.
5. Compute attribution percentages: `DE% = abs(DE)/sum * 100`, `IE% = abs(IE)/sum * 100`, `SE% = abs(SE)/sum * 100`.

**Output Specification:**
Returns a dictionary:
```python
{
    "total_variation": float,          # TV: raw observed disparity
    "direct_effect": float,            # Ctf-DE: pure discrimination
    "indirect_effect": float,          # Ctf-IE: mediated/structural bias
    "spurious_effect": float,          # Ctf-SE: confounding/historical bias
    "de_percentage": float,            # DE attribution percentage
    "ie_percentage": float,            # IE attribution percentage
    "se_percentage": float,            # SE attribution percentage
    "decomposition_verified": bool,    # True if TV == SE + IE - DE (within tolerance)
    "verification_error": float        # abs(TV - (SE + IE - DE))
}
```

## 3. Mitigation (Narrow Tailoring Optimization)
Mathematically enforces "Narrow Tailoring" by executing reparatory Affirmative Action while blocking mathematically any policy that would exceed legal bounds and create "Reverse Discrimination."

**Mathematical Foundation:**
- **Residual Disparity:** `Residual = Ctf_SE + Ctf_IE` (the part of TV not due to direct discrimination).
- **Feasibility Bounds:** `abs(DE_new) <= abs(Total_Variation)`. Ensures the corrective action does not exceed the original disparity.
- **Safety Zone:** `DE_new` must lie within `[max(0, Residual - abs(TV)), min(Residual, Residual + abs(TV))]`.

**Inputs Required:**
- `TV_orig`: Float. Original total variation from detection step.
- `Ctf_SE`: Float. Spurious effect from detection step.
- `Ctf_DE`: Float. Direct effect from detection step.
- `Ctf_IE`: Float. Indirect effect from detection step.
- `policy_type`: String. Policy to apply. Default: "disable_direct". Options: "disable_direct" (remove direct discrimination entirely) or "affirmative_action" (compute legally bounded corrective action).

**Default Parameter Tuning Guide:**
- `policy_type`: Use "disable_direct" as the default conservative option. This zeroes out DE, leaving only structural and historical effects. Use "affirmative_action" only when there is institutional authorization and legal framework for corrective action. Never default to "affirmative_action" without user confirmation.

**Pseudo-code Implementation:**
1. Compute residual disparity: `Residual = Ctf_SE + Ctf_IE`.
2. Compute legal feasibility bounds:
   a. `feasible_lower = Residual - abs(TV_orig)`
   b. `feasible_upper = Residual + abs(TV_orig)`
   c. `legal_lower = max(0, feasible_lower)`
   d. `legal_upper = min(Residual, feasible_upper)`
3. Apply policy:
   - If `policy_type == "disable_direct"`:
     Set `DE_new = 0`. New disparity = `Residual`.
   - If `policy_type == "affirmative_action"`:
     Set `optimal_DE = clamp(Residual, legal_lower, legal_upper)`.
     New disparity = `Residual - optimal_DE`.
4. Verify safety: Confirm `abs(DE_new) <= abs(TV_orig)`.
5. Export results with mitigation statistics.

**Output Specification:**
Returns a dictionary:
```python
{
    "policy_type": str,               # Policy applied
    "original_tv": float,             # Original total variation
    "residual_disparity": float,      # SE + IE
    "de_original": float,             # Original direct effect
    "de_new": float,                  # Post-mitigation direct effect
    "new_disparity": float,           # Post-mitigation total effect
    "disparity_reduction_pct": float, # Percentage reduction in total disparity
    "legal_lower_bound": float,       # Lower feasibility bound
    "legal_upper_bound": float,       # Upper feasibility bound
    "is_within_safety_zone": bool     # True if DE_new within legal bounds
}
```

## 4. Agent Coding Guidelines (Watch for bugs!)
- **Use scipy.special.expit for logistic outputs.** Never compute `1 / (1 + exp(-x))` manually. Use `from scipy.special import expit`. Raw computation overflows for large negative inputs and underflows for large positive inputs.
- **Confounder loop combinatorics.** Summation loops over Z values generate nested permutations. If Z has many unique combinations (> 1000), use binning or groupby aggregation instead of explicit nested loops. Use `data.groupby(Z_cols)` to iterate efficiently.
- **Column name validation.** Always verify that `X_col`, `W_cols`, `Z_cols`, and `Y_col` exist in `data.columns` before fitting models. Raise an explicit error listing missing columns rather than letting pandas throw a cryptic KeyError.
- **Decomposition verification tolerance.** Use `abs(TV - (SE + IE - DE)) < 0.001` as the verification threshold. If verification fails, warn the user that the causal model assumptions may be violated (e.g., missing confounders or misspecified mediators).
- **Binary sensitive attribute enforcement.** Check that `X_col` contains exactly two unique values. If not, raise an error explaining that this algorithm requires a binary sensitive attribute.
