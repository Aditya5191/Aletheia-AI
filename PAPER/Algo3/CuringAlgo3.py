import numpy as np
from typing import Tuple, Dict, Any

def _group_threshold_metrics(
    scores: np.ndarray,
    y_true: np.ndarray,
    threshold: float,
    positive_class: int = 1
) -> Tuple[float, float, float]:
    """Helper: returns (ppv, fpr, fnr) for a single group at given threshold."""
    mask = scores > threshold
    tp = np.sum(mask & (y_true == positive_class))
    fp = np.sum(mask & (y_true != positive_class))
    fn = np.sum(~mask & (y_true == positive_class))
    
    n_pos = np.sum(y_true == positive_class)
    n_neg = np.sum(y_true != positive_class)
    
    ppv = tp / (tp + fp) if (tp + fp) > 0 else np.nan
    fpr = fp / n_neg if n_neg > 0 else np.nan
    fnr = fn / n_pos if n_pos > 0 else np.nan
    return ppv, fpr, fnr


def calibrate_fairness_thresholds(
    scores: np.ndarray,
    y_true: np.ndarray,
    protected_attr: np.ndarray,
    strategy: str = 'fpr_balance',
    ppv_tolerance: float = 0.05,
    grid_steps: int = 50,
    positive_class: int = 1
) -> Dict[str, Any]:
    """
    Post-processing threshold calibration based on Chouldechova (2017) tradeoff analysis.
    Optimizes group-specific thresholds to balance chosen fairness metric.
    
    Parameters:
    -----------
    strategy : str
        'fpr_balance', 'fnr_balance', or 'ppv_parity'
    ppv_tolerance : float
        Maximum allowed PPV deviation for non-ppv strategies
    grid_steps : int
        Resolution for threshold search (percentile-based)
    """
    if strategy not in ('fpr_balance', 'fnr_balance', 'ppv_parity'):
        raise ValueError("strategy must be 'fpr_balance', 'fnr_balance', or 'ppv_parity'")
        
    groups = np.unique(protected_attr)
    if len(groups) != 2:
        raise NotImplementedError("Calibration currently supports binary protected attributes")
        
    g0, g1 = groups[0], groups[1]
    mask0, mask1 = protected_attr == g0, protected_attr == g1
    
    # Candidate thresholds: percentiles of score distribution per group
    perc = np.linspace(5, 95, grid_steps)
    t0_cands = np.percentile(scores[mask0], perc)
    t1_cands = np.percentile(scores[mask1], perc)
    
    best_cost = np.inf
    best_t0, best_t1 = t0_cands[0], t1_cands[0]
    
    # Grid search over threshold pairs
    for t0 in t0_cands:
        ppv0, fpr0, fnr0 = _group_threshold_metrics(scores[mask0], y_true[mask0], t0, positive_class)
        if np.isnan([ppv0, fpr0, fnr0]).any():
            continue
            
        for t1 in t1_cands:
            ppv1, fpr1, fnr1 = _group_threshold_metrics(scores[mask1], y_true[mask1], t1, positive_class)
            if np.isnan([ppv1, fpr1, fnr1]).any():
                continue
                
            # Strategy-specific cost
            if strategy == 'fpr_balance':
                primary = abs(fpr0 - fpr1)
                ppv_pen = max(0, abs(ppv0 - ppv1) - ppv_tolerance) * 10
                cost = primary + ppv_pen
            elif strategy == 'fnr_balance':
                primary = abs(fnr0 - fnr1)
                ppv_pen = max(0, abs(ppv0 - ppv1) - ppv_tolerance) * 10
                cost = primary + ppv_pen
            else:  # ppv_parity
                primary = abs(ppv0 - ppv1)
                fpr_pen = abs(fpr0 - fpr1)
                fnr_pen = abs(fnr0 - fnr1)
                cost = primary + 0.5 * (fpr_pen + fnr_pen)
                
            if cost < best_cost:
                best_cost = cost
                best_t0, best_t1 = t0, t1
                
    # Apply calibrated thresholds
    fair_preds = np.zeros_like(scores, dtype=int)
    fair_preds[mask0] = (scores[mask0] >= best_t0).astype(int)
    fair_preds[mask1] = (scores[mask1] >= best_t1).astype(int)
    
    return {
        'predictions': fair_preds,
        'thresholds': {g0: best_t0, g1: best_t1},
        'strategy': strategy,
        'optimization_cost': best_cost,
        'method': 'post_processing_threshold_calibration'
    }