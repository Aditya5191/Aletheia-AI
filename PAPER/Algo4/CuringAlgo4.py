import numpy as np
import pandas as pd
from typing import List, Tuple, Optional, NamedTuple

class SubgroupResult(NamedTuple):
    mask: np.ndarray
    metric_value: float
    violation_score: float
    support: int

def mitigate_subgroup_bias(
    y_pred_scores: np.ndarray,
    subgroups: List[SubgroupResult],
    global_metric: float,
    violation_threshold: float = 0.02,
    mitigation_strength: float = 1.0,
    mitigation_type: str = 'threshold'
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Apply post-processing mitigation for identified intersectional subgroups.
    
    Parameters:
    -----------
    y_pred_scores : array, shape (n_samples,)
        Continuous prediction scores (higher = more likely positive)
    subgroups : list of SubgroupResult
        Output from scan_intersectional_subgroups, sorted by violation
    global_metric : float
        Baseline metric (e.g., global positive rate)
    violation_threshold : float
        Minimum violation score to trigger mitigation
    mitigation_strength : float
        Scaling factor for adjustment magnitude
    mitigation_type : str
        'threshold' for score adjustment, 'reweight' for training weights
        
    Returns:
    --------
    adjusted_scores : array, shape (n_samples,)
        Post-processed prediction scores
    sample_weights : array, shape (n_samples,)
        Weights for in-processing retraining (if mitigation_type='reweight')
    """
    n = len(y_pred_scores)
    adjusted_scores = y_pred_scores.copy().astype(float)
    sample_weights = np.ones(n, dtype=float)
    
    if mitigation_type not in ('threshold', 'reweight'):
        raise ValueError("mitigation_type must be 'threshold' or 'reweight'")
        
    for sg in subgroups:
        if sg.violation_score < violation_threshold:
            break
            
        mask = sg.mask
        n_sub = sg.support
        if n_sub == 0:
            continue
            
        # Determine adjustment direction
        direction = np.sign(global_metric - sg.metric_value)
        if direction == 0:
            continue
            
        if mitigation_type == 'threshold':
            # Adjust scores proportionally to violation and subgroup size
            offset = direction * sg.violation_score * np.sqrt(n_sub) * mitigation_strength
            adjusted_scores[mask] += offset
            
        elif mitigation_type == 'reweight':
            # Increase weight for samples in violating subgroup
            # Direction positive means subgroup metric < global, needs upweighting
            weight_factor = 1.0 + direction * sg.violation_score * mitigation_strength
            weight_factor = np.clip(weight_factor, 0.5, 2.0)  # Prevent extreme weights
            sample_weights[mask] *= weight_factor
            
    # Ensure scores remain in valid probability range if needed
    adjusted_scores = np.clip(adjusted_scores, 0.0, 1.0)
    
    return adjusted_scores, sample_weights