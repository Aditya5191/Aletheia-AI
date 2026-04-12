import numpy as np
import pandas as pd
from scipy.spatial.distance import pdist, squareform
from scipy.stats import rankdata
from typing import Dict, Any

def double_center(dist_matrix: np.ndarray) -> np.ndarray:
    """Double-center a distance matrix: A_ij = d_ij - d_i. - d_.j + d_.."""
    row_mean = dist_matrix.mean(axis=1, keepdims=True)
    col_mean = dist_matrix.mean(axis=0, keepdims=True)
    global_mean = dist_matrix.mean()
    return dist_matrix - row_mean - col_mean + global_mean

def compute_dcor(x: np.ndarray, y: np.ndarray) -> float:
    """Compute sample distance correlation between 1D arrays."""
    n = len(x)
    if n < 2:
        return 0.0
        
    a = squareform(pdist(x.reshape(-1, 1), 'euclidean'))
    b = squareform(pdist(y.reshape(-1, 1), 'euclidean'))
    
    A = double_center(a)
    B = double_center(b)
    
    d_cov = np.mean(A * B)
    d_var_x = np.mean(A ** 2)
    d_var_y = np.mean(B ** 2)
    
    denom = np.sqrt(d_var_x * d_var_y)
    if denom == 0:
        return 0.0
    return max(0.0, d_cov / denom)

def benjamini_hochberg(p_values: np.ndarray) -> np.ndarray:
    """Apply Benjamini-Hochberg FDR correction."""
    m = len(p_values)
    if m == 0:
        return np.array([])
    ranks = rankdata(p_values, method='ordinal')
    thresholds = (ranks / m) * 0.05
    return np.minimum.accumulate((p_values / thresholds)[::-1])[::-1]

def scan_distance_correlation(
    X: pd.DataFrame,
    protected_attr: np.ndarray,
    n_perms: int = 300,
    alpha: float = 0.05,
    min_dcor: float = 0.01,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Scan features for non-linear proxy relationships using Distance Correlation.
    Returns ranked report with dCor scores, permutation p-values, and FDR-adjusted flags.
    """
    np.random.seed(random_state)
    n_samples, n_features = X.shape
    y = np.asarray(protected_attr).ravel()
    
    # Standardize
    X_std = (X.values - X.values.mean(axis=0)) / (X.values.std(axis=0) + 1e-8)
    y_std = (y - y.mean()) / (y.std() + 1e-8)
    
    dcor_obs = np.zeros(n_features)
    p_values = np.zeros(n_features)
    
    # Precompute protected attribute distance matrix components
    b = squareform(pdist(y_std.reshape(-1, 1), 'euclidean'))
    B = double_center(b)
    d_var_y = np.mean(B ** 2)
    
    for j in range(n_features):
        a = squareform(pdist(X_std[:, j].reshape(-1, 1), 'euclidean'))
        A = double_center(a)
        d_var_x = np.mean(A ** 2)
        
        dcor_obs[j] = compute_dcor(X_std[:, j], y_std)
        
        # Permutation test
        perm_stats = np.zeros(n_perms)
        for k in range(n_perms):
            y_perm = np.random.permutation(y_std)
            B_perm = double_center(squareform(pdist(y_perm.reshape(-1, 1), 'euclidean')))
            perm_cov = np.mean(A * B_perm)
            perm_var_y = np.mean(B_perm ** 2)
            denom = np.sqrt(d_var_x * perm_var_y)
            perm_stats[k] = perm_cov / denom if denom > 0 else 0.0
            
        p_values[j] = np.mean(perm_stats >= dcor_obs[j])
        
    adj_p = benjamini_hochberg(p_values)
    is_proxy = (adj_p < alpha) & (dcor_obs >= min_dcor)
    
    report = pd.DataFrame({
        'feature': X.columns,
        'dcor_score': dcor_obs,
        'p_value': p_values,
        'adj_p_value': adj_p,
        'is_proxy': is_proxy
    }).sort_values('dcor_score', ascending=False)
    
    return {
        'proxy_report': report,
        'flagged_features': report[report['is_proxy']]['feature'].tolist(),
        'n_proxies_detected': int(report['is_proxy'].sum()),
        'parameters': {'n_perms': n_perms, 'alpha': alpha, 'min_dcor': min_dcor}
    }