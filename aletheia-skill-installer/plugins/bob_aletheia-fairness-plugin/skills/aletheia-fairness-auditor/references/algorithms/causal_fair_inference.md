# Algorithm 9: Causal Fair Inference (Path-Specific Effects)

## 1. Objective
Achieve rigorous fairness by explicitly measuring and bounding isolated causal pathways (Path-Specific Effects / Natural Direct Effects) rather than blind statistical correlations. This legally targets formal "Disparate Treatment" directly by measuring discrimination while carefully preserving legitimate performance mediators independently.

## 2. Detection (IPW Effect Estimation)
Isolates direct causal pathways by evaluating classification outcomes while holding mediating factors constant and formally swapping the sensitive attribute variable.

**Mathematical Foundation:**
- **Natural Direct Effect (NDE):** `NDE = E[Y(a=1, M(a=0))] - E[Y(a=0)]`. The mean difference isolating pure direct causal impact of the sensitive attribute on the outcome, while keeping mediators at their baseline values.
- **Inverse Probability Weights (IPW):** Corrects for treatment assignment bias using propensity scores. `weight_i = 1 / P(A=a_i | C_i)` where `A` is the treatment (sensitive attribute) and `C` are confounders.

**Inputs Required:**
- `data`: pandas DataFrame containing all columns.
- `treatment_col`: String. Column name of the binary sensitive attribute (0=baseline, 1=active). Example: "gender".
- `outcome_col`: String. Column name of the binary outcome. Example: "hired".
- `confounder_cols`: List of strings. Column names of confounding variables. Example: ["age", "education"].
- `mediator_cols`: List of strings. Column names of legitimate mediating variables. Example: ["test_score", "experience"].
- `n_bootstrap`: Integer. Number of bootstrap iterations for confidence intervals. Default: 500.
- `bounds`: List of two floats `[epsilon_lower, epsilon_upper]`. Acceptable effect bounds. Default: [-0.05, 0.05].

**Default Parameter Tuning Guide:**
- `n_bootstrap`: Use 200 for quick audits on datasets < 1,000 rows. Use 1000 for production reports requiring tight confidence intervals. Higher values increase computational time linearly.
- `bounds`: Use [-0.05, 0.05] for standard audits. Tighten to [-0.02, 0.02] for legally sensitive domains (hiring, lending). Widen to [-0.10, 0.10] for exploratory analysis where some disparity is acceptable.

**Pseudo-code Implementation:**
1. Fit a logistic regression model predicting `P(A=1 | confounders)` to obtain propensity scores.
2. Clip propensity scores to `[1e-8, 1 - 1e-8]` to prevent division by zero.
3. Compute IPW weights: For each sample `i`, `weight_i = 1 / P(A=a_i | C_i)` where `a_i` is the observed treatment value.
4. Split data by treatment group:
   - `treated`: rows where `treatment_col == 1`.
   - `control`: rows where `treatment_col == 0`.
5. Compute weighted average outcomes:
   - `Y_treated_weighted = sum(Y_treated * W_treated) / sum(W_treated)`
   - `Y_control_weighted = sum(Y_control * W_control) / sum(W_control)`
6. Calculate `PSE = Y_treated_weighted - Y_control_weighted`.
7. Bootstrap the PSE by resampling `data` with replacement `n_bootstrap` times, repeating steps 1-6 each iteration.
8. Compute 95% confidence interval: `CI = [percentile(bootstrap_pses, 2.5), percentile(bootstrap_pses, 97.5)]`.
9. Flag discrimination if `PSE < bounds[0]` OR `PSE > bounds[1]`.

**Output Specification:**
Returns a dictionary:
```python
{
    "pse_estimate": float,          # Point estimate of path-specific effect
    "ci_lower": float,              # 95% CI lower bound
    "ci_upper": float,              # 95% CI upper bound
    "is_discriminatory": bool,      # True if PSE falls outside bounds
    "propensity_scores_mean": float,# Average propensity score (sanity check)
    "n_treated": int,               # Number of treated samples
    "n_control": int,               # Number of control samples
    "bounds_used": list             # The epsilon bounds applied
}
```

## 3. Mitigation (Constrained Maximum Likelihood Estimation)
Reconstruct predictions by fitting a logistic regression model that minimizes negative log-likelihood subject to the constraint that the Path-Specific Effect remains within legal bounds `[epsilon_lower, epsilon_upper]`.

**Inputs Required:**
- `X_train`: numpy array of features including `treatment_col` and `confounder_cols`. Shape (n_samples, n_features).
- `y_train`: numpy array of binary labels. Shape (n_samples,).
- `treatment_index`: Integer. Column index of the sensitive attribute within `X_train`.
- `epsilon_l`: Float. Lower bound on acceptable PSE. Default: -0.05.
- `epsilon_u`: Float. Upper bound on acceptable PSE. Default: 0.05.

**Pseudo-code Implementation:**
1. Define the negative log-likelihood function:
   ```
   def neg_log_likelihood(beta, X, y):
       logits = X @ beta
       probs = 1 / (1 + exp(-logits))
       probs = clip(probs, 1e-8, 1 - 1e-8)
       return -sum(y * log(probs) + (1 - y) * log(1 - probs))
   ```
2. Define the PSE constraint function:
   ```
   def pse_constraint(beta, X, treatment_index):
       X_treat1 = X.copy(); X_treat1[:, treatment_index] = 1
       X_treat0 = X.copy(); X_treat0[:, treatment_index] = 0
       pred_treat1 = mean(sigmoid(X_treat1 @ beta))
       pred_treat0 = mean(sigmoid(X_treat0 @ beta))
       return pred_treat1 - pred_treat0
   ```
3. Set up `scipy.optimize.minimize` with method `SLSQP`:
   - Objective: `neg_log_likelihood(beta, X_train, y_train)`
   - Constraint 1 (inequality): `pse_constraint(beta) - epsilon_l >= 0`
   - Constraint 2 (inequality): `epsilon_u - pse_constraint(beta) >= 0`
   - Initial guess: `beta_0 = zeros(n_features)`
4. Extract optimized coefficients `beta_star`.
5. Generate fair predictions: `fair_probs = sigmoid(X_test @ beta_star)`.
6. Return fair probabilities and optimization metadata.

**Output Specification:**
Returns a dictionary:
```python
{
    "fair_coefficients": np.ndarray,  # Optimized beta vector
    "fair_probabilities": np.ndarray, # Predicted probabilities on test data
    "achieved_pse": float,            # PSE of the constrained model
    "solver_converged": bool,         # True if optimizer succeeded
    "neg_log_likelihood": float,      # Final NLL value
    "epsilon_bounds": list            # [epsilon_l, epsilon_u] used
}
```

## 4. Agent Coding Guidelines (Watch for bugs!)
- **Propensity score clipping is mandatory.** Always clip propensity scores to `[1e-8, 1 - 1e-8]` before computing IPW weights. Without clipping, extreme propensities produce infinite weights that destabilize the entire estimate.
- **Scipy SLSQP convergence failures.** Always check `result.success` after optimization. If False, retry with a different initial guess (try `beta_0 = unconstrained_logistic_regression_coefficients`) or increase `maxiter` to 500.
- **Log-probability numerical safety.** Always wrap sigmoid outputs with `np.clip(probs, 1e-8, 1 - 1e-8)` before passing to `np.log()`. Raw sigmoid can return exactly 0.0 or 1.0 on extreme inputs, causing `-inf` in log-likelihood.
- **Bootstrap memory.** For large datasets (> 50,000 rows), reduce `n_bootstrap` to 200 or use subsample bootstrap (sample 50% per iteration) to avoid memory exhaustion.
