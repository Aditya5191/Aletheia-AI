from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification
import pandas as pd
import joblib
import numpy as np
import os

# Create directories
os.makedirs('dataset', exist_ok=True)

# 1. Generate Dummy Model and Data
print("Generating test_model.pkl and test_sample.csv...")

# Make a simple binary classification dataset
X, y = make_classification(n_samples=500, n_features=5, random_state=42)

# Add demographic columns
df = pd.DataFrame(X, columns=['age', 'income', 'credit_score', 'years_employed', 'zip_code'])
# Introduce some fake bias
df['gender'] = np.random.choice(['M', 'F'], size=500, p=[0.5, 0.5])
# Make income dependent on gender to simulate a proxy
df.loc[df['gender'] == 'F', 'income'] -= 2.0 

df['hired'] = y

# Train model on features only (no gender, no hired)
feature_cols = ['age', 'income', 'credit_score', 'years_employed', 'zip_code']
model = RandomForestClassifier(n_estimators=50, random_state=42)

X_train = df[feature_cols]
model.fit(X_train, y)

# Save files locally
joblib.dump(model, 'test_model.pkl')
df.to_csv('test_sample.csv', index=False)

print("Test files created: test_model.pkl, test_sample.csv")
