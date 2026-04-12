import numpy as np
from scipy.interpolate import interp1d
from sklearn.metrics import roc_curve

def compute_group_roc_curves(scores, protected_attr, y_true, positive_class=1):
    """
    Compute ROC curve points for each protected group.
    
    Returns:
    --------
    dict : {group: (fprs, tprs, thresholds)}
    """
    groups = np.unique(protected_attr)
    roc_data = {}
    
    for g in groups:
        mask = protected_attr == g
        fpr, tpr, thresholds = roc_curve(
            y_true[mask], scores[mask], pos_label=positive_class
        )
        roc_data[g] = {'fpr': fpr, 'tpr': tpr, 'thresholds': thresholds}
        
    return roc_data


def interpolate_threshold_for_tpr(fpr, tpr, thresholds, target_tpr):
    """
    Find threshold that achieves approximately target_tpr via interpolation.
    """
    # ROC curves are monotonic; use inverse interpolation
    # Handle edge cases
    if target_tpr <= tpr[0]:
        return thresholds[0]
    if target_tpr >= tpr[-1]:
        return thresholds[-1]
        
    interp_func = interp1d(tpr, thresholds, kind='linear', 
                          fill_value="extrapolate")
    return float(interp_func(target_tpr))


def compute_expected_loss(fpr, tpr, prior_positive, loss_ratio=1.0):
    """
    Compute expected loss given FPR, TPR, prior, and loss ratio.
    Loss = P(Y=0)*FPR*loss_ratio + P(Y=1)*(1-TPR)*1.0
    Assumes FN cost = 1.0, FP cost = loss_ratio
    """
    p_pos = prior_positive
    p_neg = 1.0 - p_pos
    return p_neg * fpr * loss_ratio + p_pos * (1.0 - tpr)


def mitigate_equal_opportunity(scores, protected_attr, y_true, 
                              positive_class=1, loss_ratio=1.0, 
                              grid_points=200):
    """
    Post-processing mitigation enforcing Equal Opportunity (TPR parity).
    Finds group-specific thresholds that equalize TPR while minimizing 
    expected loss across groups.
    
    Parameters:
    -----------
    scores : array-like, shape (n_samples,)
        Raw prediction scores (higher = more likely positive)
    protected_attr : array-like, shape (n_samples,)
        Group identifiers
    y_true : array-like, shape (n_samples,)
        Ground truth labels
    positive_class : int/str, default=1
        Positive outcome label
    loss_ratio : float, default=1.0
        Relative cost of false positive vs false negative
    grid_points : int, default=200
        Resolution for TPR search space
        
    Returns:
    --------
    dict : Fair predictions, optimal thresholds, achieved metrics
    """
    scores = np.asarray(scores).ravel()
    protected_attr = np.asarray(protected_attr).ravel()
    y_true = np.asarray(y_true).ravel()
    groups = np.unique(protected_attr)
    
    # Step 1: Compute priors and ROC curves
    priors = {g: np.mean(y_true[protected_attr == g] == positive_class) 
              for g in groups}
    roc_data = compute_group_roc_curves(scores, protected_attr, y_true, positive_class)
    
    # Step 2: Search for optimal common TPR
    candidate_tprs = np.linspace(0.01, 0.99, grid_points)
    best_loss = np.inf
    best_thresholds = {}
    best_tpr = None
    
    for target_tpr in candidate_tprs:
        total_weighted_loss = 0.0
        group_thresholds = {}
        valid = True
        
        for g in groups:
            roc = roc_data[g]
            # Check if target_tpr is achievable
            if target_tpr < np.min(roc['tpr']) or target_tpr > np.max(roc['tpr']):
                valid = False
                break
                
            thr = interpolate_threshold_for_tpr(
                roc['fpr'], roc['tpr'], roc['thresholds'], target_tpr
            )
            # Find corresponding FPR
            fpr_at_tpr = np.interp(target_tpr, roc['tpr'], roc['fpr'])
            
            group_loss = compute_expected_loss(
                fpr_at_tpr, target_tpr, priors[g], loss_ratio
            )
            total_weighted_loss += group_loss * len(protected_attr[protected_attr == g])
            group_thresholds[g] = thr
            
        if valid and total_weighted_loss < best_loss:
            best_loss = total_weighted_loss
            best_thresholds = group_thresholds
            best_tpr = target_tpr
            
    # Step 3: Apply thresholds
    fair_preds = np.zeros_like(scores, dtype=int)
    for g in groups:
        mask = protected_attr == g
        fair_preds[mask] = (scores[mask] >= best_thresholds[g]).astype(int)
        
    # Compute achieved metrics
    achieved_metrics = {}
    for g in groups:
        mask = protected_attr == g
        tpr_g = np.mean(fair_preds[mask][y_true[mask] == positive_class]) if np.sum(y_true[mask] == positive_class) > 0 else 0
        fpr_g = np.mean(fair_preds[mask][y_true[mask] != positive_class]) if np.sum(y_true[mask] != positive_class) > 0 else 0
        achieved_metrics[g] = {'tpr': tpr_g, 'fpr': fpr_g}
    
    return {
        'predictions': fair_preds,
        'thresholds': best_thresholds,
        'common_tpr': best_tpr,
        'total_loss': best_loss,
        'achieved_metrics': achieved_metrics,
        'method': 'equal_opportunity_post_processing'
    }


def mitigate_equalized_odds_approx(scores, protected_attr, y_true, 
                                  positive_class=1, loss_ratio=1.0, 
                                  grid_points=150):
    """
    Approximate Equalized Odds mitigation via constrained optimization.
    Finds thresholds that minimize |TPR_0 - TPR_1| + |FPR_0 - FPR_1| 
    subject to loss minimization. Uses grid search over threshold pairs.
    
    Note: Exact equalized odds may require randomization. This provides 
    a deterministic approximation suitable for production.
    """
    scores = np.asarray(scores).ravel()
    protected_attr = np.asarray(protected_attr).ravel()
    y_true = np.asarray(y_true).ravel()
    groups = np.unique(protected_attr)
    
    if len(groups) != 2:
        raise ValueError("Approximate EOD mitigation currently supports binary protected attributes")
        
    g0, g1 = groups[0], groups[1]
    mask0, mask1 = protected_attr == g0, protected_attr == g1
    
    # Candidate thresholds per group
    thr0_candidates = np.percentile(scores[mask0], np.linspace(5, 95, grid_points))
    thr1_candidates = np.percentile(scores[mask1], np.linspace(5, 95, grid_points))
    
    best_eod = np.inf
    best_loss = np.inf
    best_thr0, best_thr1 = thr0_candidates[0], thr1_candidates[0]
    
    # Grid search over threshold pairs
    for t0 in thr0_candidates:
        preds0 = (scores[mask0] >= t0).astype(int)
        tpr0 = np.mean(preds0[y_true[mask0] == positive_class]) if np.sum(y_true[mask0] == positive_class) > 0 else 0
        fpr0 = np.mean(preds0[y_true[mask0] != positive_class]) if np.sum(y_true[mask0] != positive_class) > 0 else 0
        loss0 = compute_expected_loss(fpr0, tpr0, np.mean(y_true[mask0] == positive_class), loss_ratio)
        
        for t1 in thr1_candidates:
            preds1 = (scores[mask1] >= t1).astype(int)
            tpr1 = np.mean(preds1[y_true[mask1] == positive_class]) if np.sum(y_true[mask1] == positive_class) > 0 else 0
            fpr1 = np.mean(preds1[y_true[mask1] != positive_class]) if np.sum(y_true[mask1] != positive_class) > 0 else 0
            loss1 = compute_expected_loss(fpr1, tpr1, np.mean(y_true[mask1] == positive_class), loss_ratio)
            
            eod = abs(tpr0 - tpr1) + abs(fpr0 - fpr1)
            total_loss = (loss0 * np.sum(mask0) + loss1 * np.sum(mask1))
            
            # Optimize: minimize EOD first, then loss
            if eod < best_eod or (abs(eod - best_eod) < 1e-4 and total_loss < best_loss):
                best_eod = eod
                best_loss = total_loss
                best_thr0, best_thr1 = t0, t1
                
    # Apply
    fair_preds = np.zeros_like(scores, dtype=int)
    fair_preds[mask0] = (scores[mask0] >= best_thr0).astype(int)
    fair_preds[mask1] = (scores[mask1] >= best_thr1).astype(int)
    
    return {
        'predictions': fair_preds,
        'thresholds': {g0: best_thr0, g1: best_thr1},
        'achieved_eod': best_eod,
        'total_loss': best_loss,
        'method': 'equalized_odds_approx_post_processing'
    }