import numpy as np
from typing import Dict, Tuple, Optional

def design_reparatory_policy(
    TV_orig: float,
    Ctf_SE: float,
    Ctf_DE: float,
    Ctf_IE: float,
    policy_type: str = 'narrow_tailoring'
) -> Dict[str, any]:
    """
    Design reparatory policies using the Causal Explanation Formula.
    Implements narrow tailoring principle and path-disabling interventions.
    """
    # Residual disparity after removing direct discrimination
    R = Ctf_SE + Ctf_IE
    abs_TV = abs(TV_orig)
    
    # Narrow tailoring feasible region: |R - DE_new| <= |TV_orig|
    # => DE_new ∈ [R - |TV|, R + |TV|]
    feasible_lower = R - abs_TV
    feasible_upper = R + abs_TV
    
    # Legal narrow tailoring typically requires DE_new ∈ [0, R] to avoid reverse discrimination
    legal_lower = max(0.0, feasible_lower)
    legal_upper = min(R, feasible_upper)
    
    policy_recommendation = {}
    TV_post = {}
    
    if policy_type == 'disable_direct':
        # Set DE_new = 0
        DE_new = 0.0
        TV_new = R
        policy_recommendation = {
            'action': 'Disable direct discriminatory path (DE=0)',
            'DE_new': DE_new,
            'TV_post': TV_new,
            'disparity_reduction_pct': (1 - abs(TV_new)/abs(TV_orig))*100 if TV_orig!=0 else 0
        }
        TV_post['disable_direct'] = TV_new
        
    elif policy_type == 'affirmative_action':
        if legal_lower > legal_upper:
            feasible_DE_range = None
            policy_recommendation = {'feasible': False, 'reason': 'No narrow tailoring solution exists without increasing disparity'}
        else:
            feasible_DE_range = (legal_lower, legal_upper)
            # Optimal DE_new minimizes |R - DE_new|
            optimal_DE = np.clip(R, legal_lower, legal_upper)
            optimal_TV = abs(R - optimal_DE)
            
            policy_recommendation = {
                'feasible': True,
                'action': 'Apply targeted affirmative action within narrow tailoring bounds',
                'feasible_DE_range': feasible_DE_range,
                'optimal_DE': optimal_DE,
                'TV_post': optimal_TV,
                'disparity_reduction_pct': (1 - optimal_TV/abs_TV)*100 if TV_orig!=0 else 0
            }
            TV_post['affirmative_action'] = optimal_TV
            
    elif policy_type == 'disable_spurious':
        # Simulate removing SE (e.g., through confounder adjustment)
        R_adj = Ctf_IE
        TV_new = R_adj - Ctf_DE
        policy_recommendation = {
            'action': 'Adjust for confounders to remove spurious effect',
            'TV_post': TV_new,
            'disparity_reduction_pct': (1 - abs(TV_new)/abs_TV)*100 if TV_orig!=0 else 0
        }
        TV_post['disable_spurious'] = TV_new
        
    return {
        'TV_original': TV_orig,
        'residual_disparity_R': R,
        'policy_recommendation': policy_recommendation,
        'post_intervention_TV': TV_post,
        'method': policy_type
    }