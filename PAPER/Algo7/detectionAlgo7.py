import numpy as np
import pandas as pd
from scipy.stats import pearsonr
from sklearn.linear_model import Ridge
from typing import Dict, Tuple, List, Optional

def compute_kernel_shap_weights(n_features: int, subset_size: int) -> float:
    """Compute Shapley kernel weight for a given subset size."""
    if subset_size == 0 or subset_size == n_features:
        return np.inf
    return (n_features - 1) / (np.math.comb(n_features, subset_size) * subset_size * (n_features - subset_size))

def sample_feature_subsets(n_features: int, n_samples: int, random_state: int = 42) -> np.ndarray:
    """Generate binary presence/absence vectors weighted by Shapley kernel."""
    rng = np.random.RandomState(random_state)
    # Approximate kernel sampling: sample subset sizes with probability proportional to weight
    sizes = []
    for k in range(1, n_features):
        w = compute_kernel_shap_weights(n_features, k)
        sizes.extend([k] * int(np.clip(w * 10, 1, 100)))  # Weighted sampling approximation
    sizes = np.array(sizes)
    if len(sizes) == 0:
        sizes = np.array([n_features // 2])
        
    # Sample subsets
    subsets = np.zeros((n_samples, n_features), dtype=bool)
    for i in range(n_samples):
        k = rng.choice(sizes)
        idx = rng.choice(n_features, size=k, replace=False)
        subsets[i, idx] = True
    return subsets

def approximate_conditional_expectation(model, X: np.ndarray, subsets: np.ndarray, 
                                       baseline: np.ndarray) -> np.ndarray:
    """Approximate E[f(z)|z_S] by marginalizing missing features with baseline values."""
    n_samples, n_features = subsets.shape
    predictions = np.zeros(n_samples)
    
    for i in range(n_samples):
        x_masked = baseline.copy()
        x_masked[subsets[i]] = X[i, subsets[i]]
        predictions[i] = model.predict(x_masked.reshape(1, -1))[0]
    return predictions

def solve_kernel_shap_regression(predictions: np.ndarray, subsets: np.ndarray, 
                                n_features: int, baseline_pred: float) -> np.ndarray:
    """Solve weighted linear regression to obtain SHAP values."""
    # Add intercept column
    X_reg = np.hstack([np.ones((len(subsets), 1)), subsets.astype(float)])
    weights = np.array([compute_kernel_shap_weights(n_features, int(s.sum())) for s in subsets])
    weights = np.clip(weights, 0, 1e6)  # Handle infinite weights numerically
    
    # Weighted Ridge regression
    model = Ridge(alpha=1e-3)
    sample_weights = weights / weights.sum()
    model.fit(X_reg, predictions, sample_weight=sample_weights)
    
    # SHAP values are coefficients excluding intercept
    shap_values = model.coef_[1:]
    return shap_values

def detect_proxy_shap(
    model, X: pd.DataFrame, protected_attr: np.ndarray,
    n_samples: int = 500, proxy_threshold: float = 0.25,
    redundancy_threshold: float = 0.8, random_state: int = 42
) -> Dict[str, any]:
    """
    Detect proxy features and redundancy using SHAP value attribution.
    """
    X_arr = X.values
    n_samples_data, n_features = X_arr.shape
    
    # Baseline prediction (expected value over background)
    baseline_pred = model.predict(np.mean(X_arr, axis=0).reshape(1, -1))[0]
    
    # Sample subsets and compute predictions
    subsets = sample_feature_subsets(n_features, n_samples, random_state)
    preds = approximate_conditional_expectation(model, X_arr[:n_samples], subsets, np.mean(X_arr, axis=0))
    
    # Solve for SHAP values per sample (approximated globally for efficiency)
    # In production, compute per-sample and aggregate
    global_shap = solve_kernel_shap_regression(preds, subsets, n_features, baseline_pred)
    abs_shap = np.abs(global_shap)
    
    # Compute proxy scores
    proxy_scores = np.zeros(n_features)
    for j in range(n_features):
        # Correlate feature values with protected attribute, weighted by SHAP magnitude
        corr, _ = pearsonr(X_arr[:, j], protected_attr)
        proxy_scores[j] = abs_shap[j] * abs(corr)
        
    # Compute redundancy matrix
    redundancy_matrix = np.corrcoef(abs_shap.reshape(1, -1))  # Simplified; use full matrix in practice
    
    # Flag features
    is_proxy = proxy_scores > proxy_threshold
    
    report = pd.DataFrame({
        'feature': X.columns,
        'global_shap_importance': abs_shap,
        'proxy_correlation': [abs(pearsonr(X_arr[:, j], protected_attr)[0]) for j in range(n_features)],
        'proxy_score': proxy_scores,
        'is_proxy': is_proxy
    }).sort_values('proxy_score', ascending=False)
    
    return {
        'proxy_report': report,
        'flagged_features': report[report['is_proxy']]['feature'].tolist(),
        'redundancy_matrix': np.corrcoef(X_arr.T),
        'parameters': {'n_samples': n_samples, 'proxy_threshold': proxy_threshold}
    }