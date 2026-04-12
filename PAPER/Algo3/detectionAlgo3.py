import numpy as np
import pandas as pd
from typing import Dict, Any

def compute_group_metrics(
    y_true: np.ndarray,
    scores: np.ndarray,
    protected_attr: np.ndarray,
    threshold: float,
    positive_class: int = 1
) -> Dict[str, Dict[str, float]]:
    """
    Compute fairness metrics per protected group.
    Returns prevalence, PPV, FPR, FNR, and support counts.
    """
    groups = np.unique(protected_attr)
    metrics = {}
    
    for g in groups:
        mask = protected_attr == g
        y_g = y_true[mask]
        s_g = scores[mask]
        
        high_risk = s_g > threshold
        true_pos = np.sum(high_risk & (y_g == positive_class))
        false_pos = np.sum(high_risk & (y_g != positive_class))
        true_neg = np.sum(~high_risk & (y_g != positive_class))
        false_neg = np.sum(~high_risk & (y_g == positive_class))
        
        n_pos = np.sum(y_g == positive_class)
        n_neg = np.sum(y_g != positive_class)
        n_total = len(y_g)
        
        metrics[g] = {
            'prevalence': n_pos / n_total if n_total > 0 else np.nan,
            'ppv': true_pos / (true_pos + false_pos) if (true_pos + false_pos) > 0 else np.nan,
            'fpr': false_pos / n_neg if n_neg > 0 else np.nan,
            'fnr': false_neg / n_pos if n_pos > 0 else np.nan,
            'tpr': true_pos / n_pos if n_pos > 0 else np.nan,  # 1 - FNR
            'support': n_total,
            'support_pos': n_pos,
            'support_neg': n_neg
        }
        
    return metrics


def check_predictive_parity(metrics: Dict[str, Dict[str, float]], tolerance: float = 1e-4) -> Dict[str, Any]:
    """Check if PPV is equal across groups."""
    ppv_values = [m['ppv'] for m in metrics.values() if not np.isnan(m['ppv'])]
    if len(ppv_values) < 2:
        return {'satisfied': True, 'max_diff': 0.0, 'message': 'Insufficient groups to compare'}
    max_diff = max(ppv_values) - min(ppv_values)
    return {
        'satisfied': max_diff <= tolerance,
        'max_ppv_difference': max_diff,
        'ppvs': {g: m['ppv'] for g, m in metrics.items()},
        'message': 'PPV parity satisfied' if max_diff <= tolerance else 'PPV parity violated'
    }


def check_error_rate_balance(metrics: Dict[str, Dict[str, float]], tolerance: float = 1e-4) -> Dict[str, Any]:
    """Check if FPR and FNR are equal across groups."""
    fprs = [m['fpr'] for m in metrics.values() if not np.isnan(m['fpr'])]
    fnrs = [m['fnr'] for m in metrics.values() if not np.isnan(m['fnr'])]
    
    fpr_diff = max(fprs) - min(fprs) if len(fprs) >= 2 else 0.0
    fnr_diff = max(fnrs) - min(fnrs) if len(fnrs) >= 2 else 0.0
    
    return {
        'fpr_balance_satisfied': fpr_diff <= tolerance,
        'fnr_balance_satisfied': fnr_diff <= tolerance,
        'max_fpr_difference': fpr_diff,
        'max_fnr_difference': fnr_diff,
        'message': 'Error rates balanced' if (fpr_diff <= tolerance and fnr_diff <= tolerance) else 'Error rate imbalance detected'
    }


def calculate_penalty_disparity(
    metrics: Dict[str, Dict[str, float]],
    t_min: float,
    t_max: float,
    ref_group: str
) -> Dict[str, float]:
    """
    Calculate expected penalty disparity for non-recidivists.
    Delta = (t_max - t_min) * (FPR_ref - FPR_other)
    """
    delta = {}
    fpr_ref = metrics[ref_group]['fpr']
    
    for g in metrics:
        if g == ref_group or np.isnan(metrics[g]['fpr']):
            continue
        fpr_other = metrics[g]['fpr']
        delta_g = (t_max - t_min) * (fpr_ref - fpr_other)
        delta[g] = delta_g
        
    return delta


def validate_prevalence_error_relationship(
    metrics: Dict[str, Dict[str, float]]
) -> Dict[str, Dict[str, float]]:
    """
    Verify FPR = (p/(1-p)) * ((1-PPV)/PPV) * (1-FNR)
    Returns observed vs theoretical FPR per group.
    """
    validation = {}
    for g, m in metrics.items():
        p = m['prevalence']
        ppv = m['ppv']
        fnr = m['fnr']
        fpr_obs = m['fpr']
        
        if np.isnan([p, ppv, fnr, fpr_obs]).any() or p in (0, 1) or ppv == 0:
            validation[g] = {'observed': fpr_obs, 'theoretical': np.nan, 'error': np.nan}
            continue
            
        fpr_theo = (p / (1 - p)) * ((1 - ppv) / ppv) * (1 - fnr)
        validation[g] = {
            'observed': fpr_obs,
            'theoretical': fpr_theo,
            'absolute_error': abs(fpr_obs - fpr_theo),
            'relative_error': abs(fpr_obs - fpr_theo) / fpr_obs if fpr_obs > 0 else np.nan
        }
        
    return validation


def detect_fairness_disparities(
    y_true: np.ndarray,
    scores: np.ndarray,
    protected_attr: np.ndarray,
    threshold: float,
    t_min: float = 0.0,
    t_max: float = 1.0,
    positive_class: int = 1,
    ref_group: str = None
) -> Dict[str, Any]:
    """
    Main detection function: computes metrics, checks parity, calculates disparity.
    """
    metrics = compute_group_metrics(y_true, scores, protected_attr, threshold, positive_class)
    
    if ref_group is None:
        ref_group = list(metrics.keys())[0]
        
    ppv_check = check_predictive_parity(metrics)
    error_check = check_error_rate_balance(metrics)
    penalty_delta = calculate_penalty_disparity(metrics, t_min, t_max, ref_group)
    validation = validate_prevalence_error_relationship(metrics)
    
    return {
        'group_metrics': metrics,
        'predictive_parity': ppv_check,
        'error_rate_balance': error_check,
        'penalty_disparity': penalty_delta,
        'prevalence_error_validation': validation,
        'threshold_used': threshold,
        'policy_range': (t_min, t_max)
    }