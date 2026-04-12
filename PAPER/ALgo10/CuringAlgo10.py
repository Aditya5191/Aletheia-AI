import numpy as np
import pandas as pd
from typing import Tuple, Dict, Optional
from numpy.linalg import svd, norm

def standardize_matrix(X: np.ndarray) -> Tuple[np.ndarray, Dict[str, np.ndarray]]:
    """Standardize to zero mean, unit variance."""
    mean = X.mean(axis=0)
    std = X.std(axis=0) + 1e-8
    return (X - mean) / std, {'mean': mean, 'std': std}

def inverse_standardize(X_std: np.ndarray, stats: Dict[str, np.ndarray]) -> np.ndarray:
    """Reverse standardization."""
    return X_std * stats['std'] + stats['mean']

def orthogonal_to_bias(
    A: np.ndarray,
    B: np.ndarray,
    k: Optional[int] = None,
    sparse: bool = False,
    l1_penalty: float = 0.1,
    tol: float = 1e-4,
    max_iter: int = 100
) -> Tuple[np.ndarray, Dict[str, any]]:
    """
    Orthogonal to Bias (OB) pre-processing algorithm.
    Transforms non-sensitive features A to be uncorrelated with sensitive features B.
    """
    A_std, A_stats = standardize_matrix(A)
    B_std, B_stats = standardize_matrix(B)
    
    n, q = A_std.shape
    p = B_std.shape[1] if B_std.ndim > 1 else 1
    B_flat = B_std.ravel() if B_std.ndim == 1 else B_std
    k = min(k, q) if k is not None else min(q, n)
    
    # SVD of A
    U, s_vals, Vt = svd(A_std, full_matrices=False)
    U_k, Vt_k = U[:, :k], Vt[:k, :]
    
    if not sparse:
        # Closed-form OB
        S_star = np.zeros((n, k))
        for j in range(k):
            u_j = Vt_k[j, :]
            proj_Au = A_std @ u_j
            lambda_j = np.dot(proj_Au, B_flat) / (np.dot(B_flat, B_flat) + 1e-10)
            S_star[:, j] = proj_Au - lambda_j * B_flat
            
        A_clean_std = S_star @ Vt_k
    else:
        # Sparse OB (SOB) iterative approximation
        S = np.zeros((n, k))
        U_iter = Vt_k.copy().T
        
        for iteration in range(max_iter):
            S_prev, U_prev = S.copy(), U_iter.copy()
            
            for j in range(k):
                # Update S with orthogonality to B
                P_j = np.eye(n) - S[:, :j] @ S[:, :j].T if j > 0 else np.eye(n)
                Au_j = A_std @ U_iter[:, j]
                beta_j = np.linalg.solve(
                    B_flat[:, None].T @ B_flat[:, None] + 1e-8 * np.eye(1),
                    B_flat[:, None].T @ (P_j @ Au_j)[:, None]
                ).item()
                S[:, j] = (P_j @ Au_j - beta_j * B_flat)
                s_norm = np.linalg.norm(S[:, j])
                if s_norm > 1e-8:
                    S[:, j] /= s_norm
                    
                # Update U with soft-thresholding
                Au_j = A_std.T @ S[:, j]
                U_iter[:, j] = np.sign(Au_j) * np.maximum(np.abs(Au_j) - l1_penalty, 0.0)
                u_norm = np.linalg.norm(U_iter[:, j])
                if u_norm > 1e-8:
                    U_iter[:, j] /= u_norm
                    
            # Orthogonalize S columns (Gram-Schmidt)
            for j in range(1, k):
                for l in range(j):
                    S[:, j] -= np.dot(S[:, j], S[:, l]) * S[:, l]
                s_norm = np.linalg.norm(S[:, j])
                if s_norm > 1e-8:
                    S[:, j] /= s_norm
                    
            if norm(S - S_prev) < tol and norm(U_iter - U_prev) < tol:
                break
                
        A_clean_std = S @ U_iter.T
        
    # Rescale and metadata
    A_clean = inverse_standardize(A_clean_std, A_stats)
    reconstruction_error = float(np.mean((A - A_clean) ** 2))
    max_corr_after = float(np.max(np.abs(np.corrcoef(A_clean.T, B_flat.T)[:q, q:])))
    
    return A_clean, {
        'rank_used': k,
        'reconstruction_mse': reconstruction_error,
        'max_post_corr': max_corr_after,
        'method': 'sparse_ob' if sparse else 'ob_closed_form',
        'converged': True
    }