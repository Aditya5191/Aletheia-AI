import numpy as np
import pandas as pd
import os

# Setup Output Directory
out_dir = r"c:\Users\rushi\Documents\SoultionPart2\MCP\test_data"
os.makedirs(out_dir, exist_ok=True)

# Set random seed for reproducibility
np.random.seed(42)

# ==========================================
# 1. Hiring Dataset (For Algo 1: Certifying Disparate Impact via 80% Rule)
# ==========================================
# Generates ~100 rows. Disparate impact is hardcoded: The minority group (0) 
# receives historically lower math/coding scores, resulting in a hire rate < 80% of majority.
n_samples = 100
protected_hiring = np.random.binomial(1, 0.7, n_samples)
math_score = np.where(protected_hiring == 1, np.random.normal(85, 10, n_samples), np.random.normal(70, 15, n_samples)).clip(0, 100)
coding_score = np.where(protected_hiring == 1, np.random.normal(80, 12, n_samples), np.random.normal(68, 15, n_samples)).clip(0, 100)
hired = ((math_score * 0.6 + coding_score * 0.4) > 75).astype(int)

df_hiring = pd.DataFrame({
    'candidate_id': range(1, n_samples + 1),
    'math_score': np.round(math_score, 1),
    'coding_score': np.round(coding_score, 1),
    'protected_group': protected_hiring,  # 0 = Minority, 1 = Majority
    'hired': hired                        # 0 = Rejected, 1 = Hired
})
df_hiring.to_csv(os.path.join(out_dir, "algo1_hiring_data.csv"), index=False)

# ==========================================
# 2. Lending Dataset (For Algo 2: Equalized Odds Optimization)
# ==========================================
# Generates ~120 rows. Requires mapping raw continuous risk scores against true loan payback.
# The model artificially underestimates the score of group 0 even if they pay back (creating False Negative disparity).
n_samples = 120
protected_lending = np.random.binomial(1, 0.5, n_samples)
y_true_lending = np.random.binomial(1, 0.6, n_samples) 
base_score = 0.5 + 0.3 * (y_true_lending - 0.5) + np.random.normal(0, 0.1, n_samples)
scores_lending = np.where(protected_lending == 0, base_score - 0.15, base_score).clip(0.01, 0.99)

df_lending = pd.DataFrame({
    'application_id': range(1, n_samples + 1),
    'model_approval_probability': np.round(scores_lending, 3), # Continuous score 0-1
    'protected_age_group': protected_lending,                  # 0 = Under 30, 1 = Over 30
    'repaid_loan_actual': y_true_lending                       # Ground Truth: 1 = Paid, 0 = Defaulted
})
df_lending.to_csv(os.path.join(out_dir, "algo2_lending_data.csv"), index=False)

# ==========================================
# 3. Recidivism Dataset (For Algo 3: TPR/FPR Base Rate Disparity)
# ==========================================
# Generates ~150 rows. Simulates the proven impossibility theorem where differing base rates 
# force false positive imbalances tightly coupled to continuous variables.
n_samples = 150
protected_recidivism = np.random.binomial(1, 0.5, n_samples)
y_true_recid = np.where(protected_recidivism == 1, np.random.binomial(1, 0.3, n_samples), np.random.binomial(1, 0.55, n_samples))
scores_recid = 0.5 + 0.4 * (y_true_recid - 0.5) + np.random.normal(0, 0.2, n_samples)
scores_recid = scores_recid.clip(0.01, 0.99)

df_recidivism = pd.DataFrame({
    'defendant_id': range(1, n_samples + 1),
    'recidivism_risk_score': np.round(scores_recid, 3),  # Continuous risk
    'protected_race_class': protected_recidivism,        # 0 = Minority, 1 = Majority
    'actual_recidivism_2yr': y_true_recid                # Ground Truth Target
})
df_recidivism.to_csv(os.path.join(out_dir, "algo3_recidivism_data.csv"), index=False)

print(f"✅ Generated 3 CSV files successfully in {out_dir}")
