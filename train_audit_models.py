import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
import joblib

# Create target directory
os.makedirs('test_for_model_audit', exist_ok=True)

# Load dataset
print("Loading StudentsPerformance.csv dataset...")
df = pd.read_csv('dataset/Education/StudentsPerformance.csv')

# Features we want the models to use (numerical only to avoid label-encoding alignment mismatch issues)
features = ['reading score', 'writing score']

# --- 1. Train Classification Model ---
print("Training classification model (RandomForestClassifier)...")

# Prepare classification data
df_clf = df.copy()
# Define binary target: 1 if math score >= 70 else 0
df_clf['outcome'] = (df_clf['math score'] >= 70).astype(int)
df_clf = df_clf.drop(columns=['math score'])

X_clf = df_clf[features]
y_clf = df_clf['outcome']

# Train-test split (85% train, 15% test/sample)
X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(
    X_clf, y_clf, test_size=0.15, random_state=42, stratify=y_clf
)

# Fit classifier
clf = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=5)
clf.fit(X_train_c, y_train_c)

# Save model
joblib.dump(clf, 'test_for_model_audit/classification_model.pkl')

# Construct and save sample CSV
sample_clf = df_clf.loc[X_test_c.index].copy()
sample_clf.to_csv('test_for_model_audit/classification_sample.csv', index=False)
print(f"Classification model and sample saved successfully (Sample rows: {len(sample_clf)}).")

# --- 2. Train Regression Model ---
print("Training regression model (GradientBoostingRegressor)...")

# Prepare regression data
df_reg = df.copy()
# Define continuous target
df_reg['score'] = df_reg['math score']
df_reg = df_reg.drop(columns=['math score'])

X_reg = df_reg[features]
y_reg = df_reg['score']

# Train-test split (85% train, 15% test/sample)
X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(
    X_reg, y_reg, test_size=0.15, random_state=42
)

# Fit regressor
reg = GradientBoostingRegressor(n_estimators=50, learning_rate=0.1, max_depth=3, random_state=42)
reg.fit(X_train_r, y_train_r)

# Save model
joblib.dump(reg, 'test_for_model_audit/regression_model.pkl')

# Construct and save sample CSV
sample_reg = df_reg.loc[X_test_r.index].copy()
sample_reg.to_csv('test_for_model_audit/regression_sample.csv', index=False)
print(f"Regression model and sample saved successfully (Sample rows: {len(sample_reg)}).")

print("All test assets created in 'test_for_model_audit/' directory.")
