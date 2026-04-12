import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import Ridge
from typing import List, Dict, Any

def mitigate_dcor_proxies(
    X: pd.DataFrame,
    flagged_features: List[str],
    protected_attr: np.ndarray,
    method: str = 'gbm_residual',
    scale_preserve: bool = True
) -> Dict[str, Any]:
    """
    Post-processing mitigation: Remove dCor-detected proxy dependence via residualization.
    Replaces flagged features with residuals after predicting from protected attribute.
    """
    X_clean = X.copy()
    metadata = {}
    y_attr = np.asarray(protected_attr).ravel()
    
    for feat in flagged_features:
        if feat not in X_clean.columns:
            continue
            
        x_feat = X_clean[feat].values.astype(float)
        orig_mean = x_feat.mean()
        orig_std = x_feat.std() + 1e-8
        
        # Fit predictor: A -> X_j
        if method == 'linear':
            model = Ridge(alpha=1.0)
            model.fit(y_attr.reshape(-1, 1), x_feat)
            predicted = model.predict(y_attr.reshape(-1, 1))
        else:
            model = GradientBoostingRegressor(n_estimators=100, max_depth=3, random_state=42)
            model.fit(y_attr.reshape(-1, 1), x_feat)
            predicted = model.predict(y_attr.reshape(-1, 1))
            
        residual = x_feat - predicted
        
        if scale_preserve:
            res_std = residual.std() + 1e-8
            residual = (residual / res_std) * orig_std + orig_mean
            
        X_clean[feat] = residual
        metadata[feat] = {
            'method': method,
            'variance_retained': np.var(residual) / (np.var(x_feat) + 1e-8)
        }
        
    return {
        'cleaned_data': X_clean,
        'transformation_metadata': metadata,
        'approach': 'post_processing_residualization'
    }