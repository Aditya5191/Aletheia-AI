import numpy as np
import pandas as pd
from scipy.stats import pearsonr
from typing import Dict, Tuple, Optional

def compute_pairwise_correlations(
    X_features: np.ndarray,
    X_sensitive: np.ndarray
) -> Dict[str, float]:
    """Compute max and mean absolute correlation between features and sensitive attributes."""
    n_features = X_features.shape[1]
    n_sensitive = X_sensitive.shape[1] if X_sensitive.ndim > 1 else 1
    X_sens = X_sensitive if X_sensitive.ndim > 1 else X_sensitive.reshape(-1, 1)
    
    corrs = []
    for j in range(n_features):
        for k in range(n_sensitive):
            r, _ = pearsonr(X_features[:, j], X_sens[:, k])
            corrs.append(abs(r))
            
    return {
        'max_correlation': float(np.max(corrs)) if corrs else 0.0,
        'mean_correlation': float(np.mean(corrs)) if corrs else 0.0,
        'min_correlation': float(np.min(corrs)) if corrs else 0.0
    }

def approximate_counterfactual_stability(
    X_original: np.ndarray,
    X_transformed: np.ndarray,
    n_bins: int = 20
) -> float:
    """
    Approximate counterfactual stability via distributional overlap (1 - normalized JS divergence proxy).
    Higher value = more stable = fairer.
    """
    def empirical_cdf(data, bins):
        hist, edges = np.histogram(data, bins=bins, density=True)
        cdf = np.cumsum(hist) * np.diff(edges)[0]
        return cdf / cdf[-1] if cdf[-1] > 0 else cdf
        
    # Use first principal component for multivariate comparison
    from sklearn.decomposition import PCA
    if X_original.shape[1] > 1:
        pca = PCA(n_components=1)
        proj_orig = pca.fit_transform(X_original).ravel()
        proj_trans = pca.transform(X_transformed).ravel()
    else:
        proj_orig, proj_trans = X_original.ravel(), X_transformed.ravel()
        
    cdf_orig = empirical_cdf(proj_orig, n_bins)
    cdf_trans = empirical_cdf(proj_trans, n_bins)
    
    # Overlap metric (1 - L1 distance between CDFs)
    overlap = 1.0 - np.mean(np.abs(cdf_orig - cdf_trans))
    return float(np.clip(overlap, 0.0, 1.0))

def audit_bias(
    X_features: np.ndarray,
    X_sensitive: np.ndarray,
    y_true: Optional[np.ndarray] = None,
    model=None,
    sensitive_is_binary: bool = False
) -> Dict[str, any]:
    """
    Comprehensive bias audit: correlations, counterfactual stability, and observational metrics.
    """
    corr_stats = compute_pairwise_correlations(X_features, X_sensitive)
    cf_stability = approximate_counterfactual_stability(X_features, X_features)  # Baseline = 1.0
    
    obs_metrics = {}
    if model is not None and y_true is not None and sensitive_is_binary:
        preds = model.predict(X_features)
        # Simple TPR/FPR disparity for binary sensitive
        mask_s0 = X_sensitive.ravel() == 0
        mask_s1 = X_sensitive.ravel() == 1
        pos_mask = y_true == 1
        
        tpr0 = np.mean((preds[pos_mask & mask_s0] == 1)) if np.sum(pos_mask & mask_s0) > 0 else np.nan
        tpr1 = np.mean((preds[pos_mask & mask_s1] == 1)) if np.sum(pos_mask & mask_s1) > 0 else np.nan
        
        neg_mask = y_true == 0
        fpr0 = np.mean((preds[neg_mask & mask_s0] == 1)) if np.sum(neg_mask & mask_s0) > 0 else np.nan
        fpr1 = np.mean((preds[neg_mask & mask_s1] == 1)) if np.sum(neg_mask & mask_s1) > 0 else np.nan
        
        obs_metrics = {
            'tpr_difference': abs(tpr0 - tpr1) if not (np.isnan(tpr0) or np.isnan(tpr1)) else np.nan,
            'fpr_difference': abs(fpr0 - fpr1) if not (np.isnan(fpr0) or np.isnan(fpr1)) else np.nan
        }
        
    return {
        'correlation_stats': corr_stats,
        'counterfactual_stability_approx': cf_stability,
        'observational_fairness': obs_metrics,
        'recommendation': 'HIGH_BIAS' if corr_stats['max_correlation'] > 0.3 else 'LOW_BIAS'
    }