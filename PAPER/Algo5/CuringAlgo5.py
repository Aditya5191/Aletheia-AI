import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Any

def residualize_proxy_features(
    X: pd.DataFrame,
    protected_attr: np.ndarray,
    proxy_features: List[str],
    method: str = 'gbm_residual',
    scaler: bool = True
) -> Dict[str, Any]:
    """
    Remove proxy information via conditional residualization.
    Replaces each proxy feature with its residual after predicting from protected attribute.
    """
    X_clean = X.copy()
    residuals_info = {}
    
    for feat in proxy_features:
        if feat not in X_clean.columns:
            continue
            
        x_feat = X_clean[feat].values.astype(float)
        original_mean = np.mean(x_feat)
        original_std = np.std(x_feat) + 1e-8
        
        # Fit predictor: A -> X_j
        if method == 'linear':
            from sklearn.linear_model import Ridge
            model = Ridge(alpha=1.0)
            model.fit(protected_attr.reshape(-1, 1), x_feat)
            predicted = model.predict(protected_attr.reshape(-1, 1))
        else:  # GBM residual (captures non-linear dependencies)
            model = GradientBoostingRegressor(n_estimators=100, max_depth=3, random_state=42)
            model.fit(protected_attr.reshape(-1, 1), x_feat)
            predicted = model.predict(protected_attr.reshape(-1, 1))
            
        # Compute residual
        residual = x_feat - predicted
        
        # Restore scale for downstream compatibility
        if scaler:
            residual = (residual / np.std(residual)) * original_std + original_mean
            
        X_clean[feat] = residual
        residuals_info[feat] = {
            'original_mi': None,  # Should be logged from detection phase
            'variance_retained': np.var(residual) / (np.var(x_feat) + 1e-8),
            'model_used': method
        }
        
    return {
        'cleaned_data': X_clean,
        'transformation_info': residuals_info,
        'method': method
    }