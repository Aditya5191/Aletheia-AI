import numpy as np
import pandas as pd
from scipy.optimize import minimize
from scipy.special import expit
from typing import Dict, Callable, Tuple

def neg_log_likelihood(params: np.ndarray, X: np.ndarray, y: np.ndarray) -> float:
    """Compute negative log-likelihood for logistic regression."""
    logits = X @ params
    probs = expit(logits)
    probs = np.clip(probs, 1e-8, 1 - 1e-8)
    return -np.mean(y * np.log(probs) + (1 - y) * np.log(1 - probs))

def pse_constraint_function(
    params: np.ndarray,
    X: np.ndarray,
    y: np.ndarray,
    treatment_idx: int,
    baseline_val: float = 0.0,
    active_val: float = 1.0,
    direction: str = 'upper'
) -> float:
    """
    Constraint function for PSE bounds.
    Approximates direct effect by comparing predictions with/without treatment,
    holding other features constant.
    """
    # Create counterfactual datasets
    X_baseline = X.copy()
    X_baseline[:, treatment_idx] = baseline_val
    
    X_active = X.copy()
    X_active[:, treatment_idx] = active_val
    
    # Predict probabilities
    logits_base = X_baseline @ params
    logits_active = X_active @ params
    
    p_base = expit(logits_base)
    p_active = expit(logits_active)
    
    # Approximate direct effect (mean difference)
    direct_effect = np.mean(p_active - p_base)
    
    if direction == 'upper':
        return direct_effect  # will be constrained <= epsilon_u
    else:
        return -direct_effect  # will be constrained >= epsilon_l

def mitigate_causal_bias(
    data: pd.DataFrame,
    treatment_col: str,
    outcome_col: str,
    confounder_cols: List[str],
    epsilon_l: float = -0.05,
    epsilon_u: float = 0.05,
    max_iter: int = 500
) -> Dict[str, any]:
    """
    Mitigate discriminatory path-specific effects via constrained MLE.
    Fits logistic regression with PSE bounds enforced.
    """
    # Prepare data
    feature_cols = [treatment_col] + confounder_cols
    X = data[feature_cols].values
    y = data[outcome_col].values.astype(float)
    
    # Treatment column index
    treat_idx = feature_cols.index(treatment_col)
    
    # Initial unconstrained fit
    init_model = minimize(
        neg_log_likelihood,
        x0=np.zeros(X.shape[1]),
        args=(X, y),
        method='L-BFGS-B'
    )
    x0 = init_model.x
    
    # Define constraints
    constraints = [
        {'type': 'ineq', 'fun': lambda p: pse_constraint_function(p, X, y, treat_idx, 0.0, 1.0, 'lower') - epsilon_l},
        {'type': 'ineq', 'fun': lambda p: epsilon_u - pse_constraint_function(p, X, y, treat_idx, 0.0, 1.0, 'upper')}
    ]
    
    # Solve constrained optimization
    result = minimize(
        neg_log_likelihood,
        x0=x0,
        args=(X, y),
        method='SLSQP',
        bounds=[(-5, 5) for _ in range(X.shape[1])],
        constraints=constraints,
        options={'maxiter': max_iter, 'ftol': 1e-6}
    )
    
    constrained_params = result.x
    
    # Fair prediction function
    def fair_predict(X_new: np.ndarray, marginalize: bool = True) -> np.ndarray:
        if not marginalize:
            return expit(X_new @ constrained_params)
        # Marginalize over treatment to simulate fair world
        X_base = X_new.copy()
        X_base[:, treat_idx] = 0.0
        X_active = X_new.copy()
        X_active[:, treat_idx] = 1.0
        # Average predictions to remove direct pathway
        p_base = expit(X_base @ constrained_params)
        p_active = expit(X_active @ constrained_params)
        return 0.5 * p_base + 0.5 * p_active
        
    return {
        'constrained_parameters': constrained_params,
        'optimization_success': result.success,
        'optimization_message': result.message,
        'final_objective': result.fun,
        'fair_predictor': fair_predict,
        'feature_names': feature_cols
    }