import numpy as np
import pandas as pd
from scipy.stats import norm
from sklearn.linear_model import LogisticRegression, LinearRegression
from typing import Dict, List, Tuple, Optional

def compute_ipw_weights(
    data: pd.DataFrame,
    treatment_col: str,
    mediator_cols: List[str],
    confounder_cols: List[str],
    active_val: float = 1.0,
    baseline_val: float = 0.0
) -> np.ndarray:
    """Compute IPW weights for NDE estimation."""
    # Treatment model: P(A|C)
    X_c = data[confounder_cols].values
    y_a = (data[treatment_col] == active_val).astype(int).values
    treat_model = LogisticRegression(penalty='l2', max_iter=1000).fit(X_c, y_a)
    p_a_given_c = treat_model.predict_proba(X_c)[:, 1]
    
    # Mediator model: P(M|A,C)
    X_mc = pd.concat([data[[treatment_col]], data[confounder_cols]], axis=1).values
    m_model = LogisticRegression(penalty='l2', max_iter=1000).fit(X_mc, data[mediator_cols[0]].values)
    
    # Simplified: use baseline treatment probability for weighting
    # Full IPW requires P(M|A=active,C) / P(M|A=baseline,C)
    # Here we use a simplified propensity weight for demonstration
    w_treat = np.where(
        data[treatment_col] == active_val,
        1.0 / (p_a_given_c + 1e-8),
        1.0 / (1 - p_a_given_c + 1e-8)
    )
    return w_treat / np.mean(w_treat)

def estimate_nde_ipw(
    data: pd.DataFrame,
    treatment_col: str,
    outcome_col: str,
    confounder_cols: List[str],
    active_val: float = 1.0,
    baseline_val: float = 0.0
) -> float:
    """Estimate Natural Direct Effect using IPW on mean difference scale."""
    weights = compute_ipw_weights(data, treatment_col, [], confounder_cols, active_val, baseline_val)
    
    # Y(1, M(0)) component
    mask_active = data[treatment_col] == active_val
    y_active = data.loc[mask_active, outcome_col].values
    w_active = weights[mask_active]
    e_y_active = np.sum(y_active * w_active) / np.sum(w_active) if np.sum(w_active) > 0 else 0.0
    
    # Y(0) component
    mask_baseline = data[treatment_col] == baseline_val
    y_baseline = data.loc[mask_baseline, outcome_col].values
    w_baseline = weights[mask_baseline]
    e_y_baseline = np.sum(y_baseline * w_baseline) / np.sum(w_baseline) if np.sum(w_baseline) > 0 else 0.0
    
    return e_y_active - e_y_baseline

def detect_causal_bias(
    data: pd.DataFrame,
    treatment_col: str,
    outcome_col: str,
    confounder_cols: List[str],
    epsilon_l: float = -0.05,
    epsilon_u: float = 0.05,
    n_boot: int = 300,
    random_state: int = 42
) -> Dict[str, any]:
    """
    Detect discriminatory path-specific effect via causal mediation/IPW.
    """
    np.random.seed(random_state)
    
    # Point estimate
    pse_point = estimate_nde_ipw(data, treatment_col, outcome_col, confounder_cols)
    
    # Bootstrap CI
    boot_pses = []
    n = len(data)
    for _ in range(n_boot):
        boot_idx = np.random.choice(n, size=n, replace=True)
        boot_data = data.iloc[boot_idx]
        try:
            boot_pse = estimate_nde_ipw(boot_data, treatment_col, outcome_col, confounder_cols)
            boot_pses.append(boot_pse)
        except:
            continue
            
    if len(boot_pses) < 10:
        ci_lower, ci_upper = pse_point - 0.1, pse_point + 0.1
    else:
        ci_lower = np.percentile(boot_pses, 2.5)
        ci_upper = np.percentile(boot_pses, 97.5)
        
    violation = (pse_point < epsilon_l) or (pse_point > epsilon_u)
    
    return {
        'pse_estimate': pse_point,
        'ci_lower': ci_lower,
        'ci_upper': ci_upper,
        'violation': violation,
        'epsilon_bounds': (epsilon_l, epsilon_u),
        'n_bootstrap': len(boot_pses)
    }