import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split

# Set random seed for reproducibility
np.random.seed(42)

def generate_lending_data():
    print("Generating complex lending dataset (Intersectional Bias + Proxy)...")
    n_samples = 1000
    
    # Features
    income = np.random.normal(50000, 15000, n_samples)
    credit_score = np.random.normal(650, 50, n_samples)
    loan_amount = np.random.normal(20000, 5000, n_samples)
    
    # Protected Attributes
    gender = np.random.choice(['Male', 'Female'], size=n_samples)
    race = np.random.choice(['White', 'Black', 'Asian', 'Hispanic'], size=n_samples)
    
    # Hidden Proxy: Zip Code (Non-linear correlation with Race)
    # Zip code 90001 is 80% Black, 90210 is 90% White
    zip_code = []
    for r in race:
        if r == 'Black':
            zip_code.append(np.random.choice([90001, 90002], p=[0.8, 0.2]))
        elif r == 'White':
            zip_code.append(np.random.choice([90210, 90211], p=[0.9, 0.1]))
        else:
            zip_code.append(np.random.choice([91001, 91002]))
    
    df = pd.DataFrame({
        'income': income,
        'credit_score': credit_score,
        'loan_amount': loan_amount,
        'zip_code': zip_code,
        'gender': gender,
        'race': race
    })

    # Ground Truth Logic (Target: 'approved')
    # Base approval is based on credit and income
    prob = (income / 100000) + (credit_score / 1000) - (loan_amount / 50000)
    
    # Introduce INTERSECTIONAL BIAS
    # Black Women get a significant penalty (-0.3)
    for i in range(n_samples):
        if df.loc[i, 'race'] == 'Black' and df.loc[i, 'gender'] == 'Female':
            prob[i] -= 0.3
        # Small penalty for just being in 90001 (Proxy bias)
        if df.loc[i, 'zip_code'] == 90001:
            prob[i] -= 0.1

    # Convert to binary target
    df['approved'] = (prob > 0.8).astype(int)
    
    # Train a model that ignores Gender/Race but sees the Zip Code (Proxy)
    X = df[['income', 'credit_score', 'loan_amount', 'zip_code']]
    y = df['approved']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Use Gradient Boosting (Non-linear) to capture the Zip Code proxy
    model = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42)
    model.fit(X_train, y_train)
    
    # Save Model
    joblib.dump(model, 'classification_model_testing/lending_model.pkl')
    
    # Save Sample (With Protected Attributes for the Audit)
    test_df = df.iloc[X_test.index].copy()
    test_df.to_csv('classification_model_testing/lending_sample.csv', index=False)
    
    print(f"Created classification_model_testing/lending_model.pkl and classification_model_testing/lending_sample.csv ({len(test_df)} test samples)")
    print(f"Intersectional Black-Female Approval Rate: {df[(df['race']=='Black') & (df['gender']=='Female')]['approved'].mean():.2%}")
    print(f"White-Male Approval Rate: {df[(df['race']=='White') & (df['gender']=='Male')]['approved'].mean():.2%}")

if __name__ == "__main__":
    generate_lending_data()
