import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

@dataclass
class SubgroupResult:
    mask: np.ndarray
    conditions: Dict[str, str]
    support: int
    metric_value: float
    violation_score: float
    p_value: float
    ci_lower: float
    ci_upper: float


def compute_positive_rate(y_true: np.ndarray, y_pred: np.ndarray, mask: np.ndarray, positive_class: int = 1) -> float:
    """Compute positive prediction rate for a subgroup."""
    if np.sum(mask) == 0:
        return np.nan
    return np.mean(y_pred[mask] == positive_class)


def compute_violation_score(metric_sub: float, metric_global: float, n_sub: int) -> float:
    """Compute normalized violation score: |Δ| / sqrt(n) to penalize small subgroups."""
    if n_sub == 0:
        return 0.0
    return abs(metric_sub - metric_global) / np.sqrt(n_sub)


def compute_ci(metric: float, n: int, confidence: float = 0.95) -> Tuple[float, float]:
    """Compute Wilson score confidence interval for a proportion."""
    if n == 0:
        return 0.0, 0.0
    z = stats.norm.ppf(1 - (1 - confidence) / 2)
    denominator = 1 + z**2 / n
    centre_adjusted = metric + z**2 / (2 * n)
    adjusted_standard_deviation = np.sqrt(metric * (1 - metric) / n + z**2 / (4 * n**2))
    lower = (centre_adjusted - z * adjusted_standard_deviation) / denominator
    upper = (centre_adjusted + z * adjusted_standard_deviation) / denominator
    return lower, upper


def scan_intersectional_subgroups(
    X_protected: pd.DataFrame,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    positive_class: int = 1,
    max_depth: int = 3,
    min_support_frac: float = 0.02,
    alpha: float = 0.05,
    n_subgroups: int = 10
) -> List[SubgroupResult]:
    """
    Scan intersectional subgroups for fairness violations.
    
    Parameters:
    -----------
    X_protected : DataFrame, shape (n_samples, n_protected_features)
        Protected/covariate attributes for subgroup definition
    y_true : array, shape (n_samples,)
        Ground truth labels
    y_pred : array, shape (n_samples,)
        Model predictions
    positive_class : int
        Class to evaluate positive rate for
    max_depth : int
        Maximum number of attribute conjunctions in a subgroup
    min_support_frac : float
        Minimum fraction of dataset required to consider a subgroup
    alpha : float
        Significance threshold for violation testing
    n_subgroups : int
        Number of top subgroups to return
        
    Returns:
    --------
    List[SubgroupResult] : Ranked subgroups with violation metrics
    """
    n = len(y_true)
    global_rate = compute_positive_rate(y_true, y_pred, np.ones(n, dtype=bool), positive_class)
    min_support = int(np.ceil(min_support_frac * n))
    
    # Start with root subgroup
    root = SubgroupResult(
        mask=np.ones(n, dtype=bool),
        conditions={},
        support=n,
        metric_value=global_rate,
        violation_score=0.0,
        p_value=1.0,
        ci_lower=global_rate,
        ci_upper=global_rate
    )
    
    candidates = [root]
    discovered = []
    used_masks = {frozenset(np.where(root.mask)[0].tobytes())}
    
    while candidates and max(discovered + [root], key=lambda x: x.support).support >= min_support:
        # Sort by violation score descending
        candidates.sort(key=lambda x: x.violation_score, reverse=True)
        current = candidates.pop(0)
        discovered.append(current)
        
        if current.support < min_support or len(current.conditions) >= max_depth:
            continue
            
        # Expand on all protected attributes
        for col in X_protected.columns:
            for val in X_protected[col].unique():
                child_mask = current.mask & (X_protected[col].values == val)
                n_child = np.sum(child_mask)
                
                if n_child < min_support:
                    continue
                    
                # Avoid duplicate masks
                mask_key = frozenset(np.where(child_mask)[0].tobytes())
                if mask_key in used_masks:
                    continue
                used_masks.add(mask_key)
                
                child_rate = compute_positive_rate(y_true, y_pred, child_mask, positive_class)
                violation = compute_violation_score(child_rate, global_rate, n_child)
                
                # Simple z-test for proportion difference
                se = np.sqrt(child_rate * (1 - child_rate) / n_child + global_rate * (1 - global_rate) / n)
                z_stat = abs(child_rate - global_rate) / se if se > 0 else 0
                p_val = 2 * (1 - stats.norm.cdf(z_stat))
                
                ci_lower, ci_upper = compute_ci(child_rate, n_child)
                
                conditions = dict(current.conditions)
                conditions[col] = val
                
                child_result = SubgroupResult(
                    mask=child_mask,
                    conditions=conditions,
                    support=n_child,
                    metric_value=child_rate,
                    violation_score=violation,
                    p_value=p_val,
                    ci_lower=ci_lower,
                    ci_upper=ci_upper
                )
                
                if p_val < alpha:
                    candidates.append(child_result)
                    
    return sorted(discovered, key=lambda x: x.violation_score, reverse=True)[:n_subgroups]