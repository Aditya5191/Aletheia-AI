import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from typing import Dict, List, Tuple

def mitigate_proxy_shap(
    X: pd.DataFrame,
    protected_attr: np.ndarray,
    shap_report: pd.DataFrame,
    mitigation_type: str = 'residualize',
    alpha: float = 0.5,
    variance_clip: float = 0.2
) -> Dict[str, any]:
    """
    Mitigate proxy discrimination using SHAP-guided feature adjustment.
    
    Parameters:
    -----------
    X : DataFrame, shape (n_samples, n_features)
    protected_attr : array, shape (n_samples,)
    shap_report : DataFrame from detect_proxy_shap
    mitigation_type : 'remove', 'residualize', or 'reweight'
    alpha : float, reweighting strength
    variance_clip : float, minimum variance retention threshold
    
    Returns:
    --------
    dict with mitigated data, sample weights, and metadata
    """
    X_mitigated = X.copy()
    n_samples = len(X)
    sample_weights = np.ones(n_samples)
    metadata = {'mitigation_type': mitigation_type, 'features_modified': []}
    
    proxy_mask = shap_report['is_proxy']
    proxy_features = shap_report.loc[proxy_mask, 'feature'].tolist()
    
    if mitigation_type == 'remove':
        X_mitigated = X_mitigated.drop(columns=proxy_features, errors='ignore')
        metadata['features_modified'] = proxy_features
        metadata['action'] = 'removed'
        
    elif mitigation_type == 'residualize':
        for feat in proxy_features:
            if feat not in X_mitigated.columns:
                continue
            y_feat = X_mitigated[feat].values.astype(float)
            orig_var = np.var(y_feat) + 1e-8
            
            # Regress on protected attribute
            model = Ridge(alpha=1.0)
            model.fit(protected_attr.reshape(-1, 1), y_feat)
            predicted = model.predict(protected_attr.reshape(-1, 1))
            residual = y_feat - predicted
            
            # Check variance retention
            residual_var = np.var(residual)
            if residual_var / orig_var < variance_clip:
                # Feature too dependent; keep original but flag
                continue
                
            # Restore scale
            res_std = np.std(residual) + 1e-8
            residual_scaled = (residual / res_std) * np.std(y_feat) + np.mean(y_feat)
            X_mitigated[feat] = residual_scaled
            metadata['features_modified'].append(feat)
        metadata['action'] = 'residualized'
        
    elif mitigation_type == 'reweight':
        # Create weight map from SHAP proxy scores
        score_map = dict(zip(shap_report['feature'], shap_report['proxy_score']))
        for feat in proxy_features:
            score = score_map.get(feat, 0)
            # Reduce weight for samples where proxy feature is extreme
            if feat in X.columns:
                feat_vals = np.abs(X[feat].values)
                feat_norm = (feat_vals - feat_vals.mean()) / (feat_vals.std() + 1e-8)
                sample_weights *= np.exp(-alpha * score * feat_norm)
        sample_weights = np.clip(sample_weights, 0.1, 5.0)
        sample_weights /= sample_weights.mean()  # Normalize
        metadata['action'] = 'reweighted'
        metadata['features_modified'] = proxy_features
    else:
        raise ValueError("mitigation_type must be 'remove', 'residualize', or 'reweight'")
        
    return {
        'mitigated_data': X_mitigated,
        'sample_weights': sample_weights,
        'metadata': metadata
    }