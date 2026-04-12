import numpy as np
import pandas as pd
from scipy.spatial import KDTree
from scipy.stats import rankdata
from typing import Tuple, Dict, Any

def estimate_mi_knn(x: np.ndarray, y: np.ndarray, k: int = 3, eps: float = 1e-10) -> float:
    """
    Estimate Mutual Information using Kraskov-Stögbauer-Grassberger k-NN estimator.
    Handles continuous and discrete variables via mixed-type distance approximation.
    """
    n = len(x)
    x = np.asarray(x).reshape(-1, 1)
    y = np.asarray(y).reshape(-1, 1)
    
    # Combine and scale
    xy = np.column_stack([x, y])
    tree_xy = KDTree(xy)
    tree_x = KDTree(x)
    tree_y = KDTree(y)
    
    # Find k-th nearest neighbor distance in joint space
    dists, _ = tree_xy.query(xy, k=k+1)
    epsilon = dists[:, k] + eps  # k+1 because 0-th is self
    
    # Count neighbors within epsilon in marginal spaces
    nx = tree_x.query_radius(x, r=epsilon, count_only=True)
    ny = tree_y.query_radius(y, r=epsilon, count_only=True)
    
    # KSG estimator: I(X;Y) ≈ ψ(N) - <ψ(nx+1) + ψ(ny+1)> + ψ(k)
    psi = np.vectorize(np.math.lgamma)
    mi = psi(n) - np.mean(psi(nx + 1) + psi(ny + 1)) + psi(k)
    
    return max(0.0, mi)  # MI cannot be negative


def benjamini_hochberg(p_values: np.ndarray) -> np.ndarray:
    """Apply Benjamini-Hochberg procedure for FDR control."""
    m = len(p_values)
    ranks = rankdata(p_values, method='ordinal')
    bh_thresholds = (ranks / m) * 0.05
    return np.minimum.accumulate(p_values / bh_thresholds[::-1])[::-1]


def scan_proxy_features(
    X: pd.DataFrame,
    protected_attr: np.ndarray,
    k: int = 3,
    n_perms: int = 200,
    alpha: float = 0.05,
    min_mi: float = 0.01,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Scan features for proxy relationships with protected attribute.
    Returns MI scores, p-values, FDR-adjusted p-values, and boolean proxy flags.
    """
    np.random.seed(random_state)
    n_samples, n_features = X.shape
    mi_observed = np.zeros(n_features)
    p_values = np.zeros(n_features)
    
    # Convert to numpy for speed
    X_arr = X.values.astype(float)
    y_attr = np.asarray(protected_attr).astype(float)
    
    # Step 1: Compute observed MI
    for j in range(n_features):
        mi_observed[j] = estimate_mi_knn(X_arr[:, j], y_attr, k)
        
    # Step 2: Permutation testing
    for j in range(n_features):
        perm_mis = np.zeros(n_perms)
        for p in range(n_perms):
            perm_attr = np.random.permutation(y_attr)
            perm_mis[p] = estimate_mi_knn(X_arr[:, j], perm_attr, k)
        p_values[j] = np.mean(perm_mis >= mi_observed[j])
        
    # Step 3: FDR correction
    adj_p = benjamini_hochberg(p_values)
    
    # Step 4: Flag proxies
    is_proxy = (adj_p < alpha) & (mi_observed > min_mi)
    
    # Compile results
    results = pd.DataFrame({
        'feature': X.columns,
        'mi_score': mi_observed,
        'p_value': p_values,
        'adj_p_value': adj_p,
        'is_proxy': is_proxy
    }).sort_values('mi_score', ascending=False)
    
    return {
        'proxy_report': results,
        'flagged_features': results[results['is_proxy']]['feature'].tolist(),
        'n_proxies_detected': int(results['is_proxy'].sum()),
        'parameters': {'k': k, 'n_perms': n_perms, 'alpha': alpha, 'min_mi': min_mi}
    }