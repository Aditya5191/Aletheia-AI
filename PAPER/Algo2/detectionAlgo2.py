import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix

def compute_group_conditional_rates(y_true, y_pred, protected_attr, positive_class=1):
    """
    Compute TPR and FPR for each protected group.
    
    Parameters:
    -----------
    y_true : array-like, shape (n_samples,)
        Ground truth labels
    y_pred : array-like, shape (n_samples,)
        Predicted labels
    protected_attr : array-like, shape (n_samples,)
        Protected group identifiers
    positive_class : int or str, default=1
        Label representing the positive/advantaged outcome
        
    Returns:
    --------
    dict : Group-wise TPR, FPR, support counts
    """
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    protected_attr = np.asarray(protected_attr)
    
    groups = np.unique(protected_attr)
    metrics = {}
    
    for g in groups:
        mask_pos = (protected_attr == g) & (y_true == positive_class)
        mask_neg = (protected_attr == g) & (y_true != positive_class)
        
        # True Positive Rate (Recall)
        if np.sum(mask_pos) > 0:
            tp = np.sum((y_pred[mask_pos] == positive_class))
            tpr = tp / np.sum(mask_pos)
        else:
            tpr = np.nan
            
        # False Positive Rate
        if np.sum(mask_neg) > 0:
            fp = np.sum((y_pred[mask_neg] == positive_class))
            fpr = fp / np.sum(mask_neg)
        else:
            fpr = np.nan
            
        metrics[g] = {'tpr': tpr, 'fpr': fpr, 
                      'support_pos': np.sum(mask_pos),
                      'support_neg': np.sum(mask_neg)}
        
    return metrics


def calculate_equalized_odds_difference(y_true, y_pred, protected_attr, 
                                       positive_class=1, ref_group=None):
    """
    Calculate Equalized Odds Difference and Equal Opportunity Difference.
    
    Equalized Odds Difference = |TPR_0 - TPR_1| + |FPR_0 - FPR_1|
    Equal Opportunity Difference = |TPR_0 - TPR_1|
    
    Parameters:
    -----------
    y_true, y_pred, protected_attr : array-like
        Labels, predictions, and protected attribute
    positive_class : int/str
        Positive outcome label
    ref_group : optional
        Reference group for pairwise comparison (default: first unique group)
        
    Returns:
    --------
    dict : Fairness metrics and group-wise rates
    """
    rates = compute_group_conditional_rates(y_true, y_pred, protected_attr, positive_class)
    groups = list(rates.keys())
    
    if ref_group is None:
        ref_group = groups[0]
        
    tpr_diffs = {}
    fpr_diffs = {}
    
    for g in groups:
        if g == ref_group:
            continue
        tpr_diff = abs(rates[g]['tpr'] - rates[ref_group]['tpr'])
        fpr_diff = abs(rates[g]['fpr'] - rates[ref_group]['fpr'])
        tpr_diffs[g] = tpr_diff
        fpr_diffs[g] = fpr_diff
        
    # Aggregate maximum disparity for binary case
    if len(groups) == 2:
        max_tpr_diff = list(tpr_diffs.values())[0] if tpr_diffs else 0.0
        max_fpr_diff = list(fpr_diffs.values())[0] if fpr_diffs else 0.0
    else:
        max_tpr_diff = max(tpr_diffs.values()) if tpr_diffs else 0.0
        max_fpr_diff = max(fpr_diffs.values()) if fpr_diffs else 0.0
        
    return {
        'group_rates': rates,
        'equalized_odds_difference': max_tpr_diff + max_fpr_diff,
        'equal_opportunity_difference': max_tpr_diff,
        'tpr_disparities': tpr_diffs,
        'fpr_disparities': fpr_diffs,
        'reference_group': ref_group,
        'passes_equalized_odds': (max_tpr_diff + max_fpr_diff) < 1e-6,
        'passes_equal_opportunity': max_tpr_diff < 1e-6
    }