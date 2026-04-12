import numpy as np
import pandas as pd
from scipy import stats
from sklearn.preprocessing import QuantileTransformer
import warnings

def empirical_cdf(values, quantiles=1000):
    """
    Compute empirical CDF and quantile function for a 1D array.
    
    Returns:
    --------
    cdf_func : function mapping value -> quantile [0,1]
    quantile_func : function mapping quantile [0,1] -> value
    """
    values_sorted = np.sort(values)
    n = len(values_sorted)
    
    # Create quantile positions (avoid 0 and 1 for numerical stability)
    positions = np.arange(1, n + 1) / (n + 1)
    
    def cdf_func(v):
        """Map value to its quantile position"""
        return np.searchsorted(values_sorted, v, side='right') / n
    
    def quantile_func(q):
        """Map quantile to value via interpolation"""
        q_clipped = np.clip(q, 1/(n+1), n/(n+1))
        return np.interp(q_clipped, positions, values_sorted)
    
    return cdf_func, quantile_func


def compute_median_distribution(quantile_funcs, quantile_grid=1000):
    """
    Compute median distribution from multiple quantile functions.
    
    Parameters:
    -----------
    quantile_funcs : list of functions
        Each maps quantile [0,1] -> value
    quantile_grid : int
        Number of quantile points to evaluate
        
    Returns:
    --------
    median_quantile_func : function mapping quantile -> median value
    """
    quantiles = np.linspace(0, 1, quantile_grid)
    values_at_quantiles = np.array([f(quantiles) for f in quantile_funcs])
    
    # Median across groups at each quantile
    median_values = np.median(values_at_quantiles, axis=0)
    
    def median_quantile_func(q):
        q_array = np.atleast_1d(q)
        result = np.interp(q_array, quantiles, median_values)
        return result[0] if np.isscalar(q) else result
    
    return median_quantile_func


def geometric_repair_feature(values, protected_groups, lambda_param=1.0):
    """
    Apply geometric partial repair to a single feature.
    
    Parameters:
    -----------
    values : array-like, shape (n_samples,)
        Feature values to repair
    protected_groups : array-like, shape (n_samples,)
        Protected attribute values (binary: 0 or 1)
    lambda_param : float in [0,1]
        Repair intensity: 0=no repair, 1=full repair
        
    Returns:
    --------
    repaired_values : ndarray, shape (n_samples,)
        Repaired feature values
    """
    values = np.asarray(values).ravel()
    protected_groups = np.asarray(protected_groups).ravel()
    
    # Compute conditional quantile functions for each group
    quantile_funcs = {}
    cdf_funcs = {}
    
    for group in np.unique(protected_groups):
        mask = protected_groups == group
        group_values = values[mask]
        
        if len(group_values) < 2:
            # Fallback: use global distribution if group too small
            cdf_funcs[group], quantile_funcs[group] = empirical_cdf(values)
        else:
            cdf_funcs[group], quantile_funcs[group] = empirical_cdf(group_values)
    
    # Compute median distribution
    median_quantile_func = compute_median_distribution(list(quantile_funcs.values()))
    
    # Apply repair transformation
    repaired = np.zeros_like(values, dtype=float)
    
    for i, (val, group) in enumerate(zip(values, protected_groups)):
        # Get rank (quantile position) of value within its group
        rank = cdf_funcs[group](val)
        
        # Get original and fully-repaired values at this rank
        val_original = quantile_funcs[group](rank)
        val_repaired_full = median_quantile_func(rank)
        
        # Geometric interpolation in value space
        repaired[i] = (1 - lambda_param) * val_original + lambda_param * val_repaired_full
    
    return repaired


def combinatorial_repair_feature(values, protected_groups, lambda_param=1.0, 
                                quantile_grid=1000):
    """
    Apply combinatorial partial repair to a single feature.
    
    Note: This variant interpolates in rank space rather than value space.
    It may not strictly preserve rank ordering but is simpler to implement.
    
    Parameters:
    -----------
    values : array-like, shape (n_samples,)
        Feature values to repair
    protected_groups : array-like, shape (n_samples,)
        Protected attribute values (binary: 0 or 1)
    lambda_param : float in [0,1]
        Repair intensity: 0=no repair, 1=full repair
    quantile_grid : int
        Resolution for quantile discretization
        
    Returns:
    --------
    repaired_values : ndarray, shape (n_samples,)
        Repaired feature values
    """
    values = np.asarray(values).ravel()
    protected_groups = np.asarray(protected_groups).ravel()
    
    # Compute conditional quantile functions
    quantile_funcs = {}
    cdf_funcs = {}
    
    for group in np.unique(protected_groups):
        mask = protected_groups == group
        group_values = values[mask]
        cdf_funcs[group], quantile_funcs[group] = empirical_cdf(group_values)
    
    # Compute median distribution
    median_quantile_func = compute_median_distribution(list(quantile_funcs.values()))
    
    # Apply repair: interpolate rank toward median (0.5)
    repaired = np.zeros_like(values, dtype=float)
    
    for i, (val, group) in enumerate(zip(values, protected_groups)):
        original_rank = cdf_funcs[group](val)
        
        # Move rank toward median (0.5) based on lambda
        repaired_rank = (1 - lambda_param) * original_rank + lambda_param * 0.5
        repaired_rank = np.clip(repaired_rank, 0, 1)  # Ensure valid quantile
        
        # Map repaired rank through median distribution
        repaired[i] = median_quantile_func(repaired_rank)
    
    return repaired


def repair_disparate_impact(Y, X, lambda_param=1.0, method='geometric', 
                           feature_names=None, protected_column=None):
    """
    Main function to repair dataset for disparate impact mitigation.
    
    Parameters:
    -----------
    Y : pd.DataFrame or ndarray, shape (n_samples, n_features)
        Feature matrix (protected attribute should be excluded)
    X : array-like, shape (n_samples,)
        Protected attribute values (binary: 0=minority, 1=majority)
    lambda_param : float in [0,1], default=1.0
        Repair intensity: 0=no repair, 1=full repair
    method : str, default='geometric'
        Repair method: 'geometric' (value-space) or 'combinatorial' (rank-space)
    feature_names : list, optional
        Names of features for DataFrame output
    protected_column : str, optional
        Name of protected attribute column (for logging; not used in computation)
        
    Returns:
    --------
    Y_repaired : pd.DataFrame or ndarray
        Repaired feature matrix with same shape and type as input Y
    repair_metadata : dict
        Metadata about the repair process
    """
    # Input validation
    if lambda_param < 0 or lambda_param > 1:
        raise ValueError("lambda_param must be in [0, 1]")
    
    if method not in ['geometric', 'combinatorial']:
        raise ValueError("method must be 'geometric' or 'combinatorial'")
    
    # Convert to numpy for processing, preserve DataFrame structure if applicable
    is_dataframe = isinstance(Y, pd.DataFrame)
    if is_dataframe:
        feature_names = Y.columns.tolist() if feature_names is None else feature_names
        Y_array = Y.values
    else:
        Y_array = np.asarray(Y)
        feature_names = [f"feature_{i}" for i in range(Y_array.shape[1])] if feature_names is None else feature_names
    
    X = np.asarray(X).ravel()
    n_samples, n_features = Y_array.shape
    
    # Select repair function
    repair_func = geometric_repair_feature if method == 'geometric' else combinatorial_repair_feature
    
    # Apply repair to each feature independently
    Y_repaired_array = np.zeros_like(Y_array, dtype=float)
    
    for j in range(n_features):
        Y_repaired_array[:, j] = repair_func(
            Y_array[:, j], X, lambda_param=lambda_param
        )
    
    # Restore DataFrame structure if input was DataFrame
    if is_dataframe:
        Y_repaired = pd.DataFrame(Y_repaired_array, columns=feature_names, index=Y.index)
    else:
        Y_repaired = Y_repaired_array
    
    # Metadata for transparency
    repair_metadata = {
        'method': method,
        'lambda_param': lambda_param,
        'n_features': n_features,
        'n_samples': n_samples,
        'protected_groups': np.unique(X).tolist(),
        'feature_names': feature_names
    }
    
    return Y_repaired, repair_metadata