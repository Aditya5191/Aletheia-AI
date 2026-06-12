import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split

# Set random seed for reproducibility
np.random.seed(42)

def generate_regression_data():
    print("Generating complex regression dataset (Interest Rate Prediction)...")
    n_samples = 1000
    
    # Features
    income = np.random.normal(50000, 15000, n_samples)
    credit_score = np.random.normal(650, 50, n_samples)
    loan_amount = np.random.normal(20000, 5000, n_samples)
    
    # Protected Attributes
    gender = np.random.choice(['Male', 'Female'], size=n_samples)
    race = np.random.choice(['White', 'Black', 'Asian', 'Hispanic'], size=n_samples)
    
    # Target: Interest Rate (Continuous)
    # Base rate is inversely proportional to credit score and income
    base_rate = 15.0 - (credit_score / 100) - (income / 50000)
    
    # Introduce REGRESSION BIAS
    # Black applicants get a 'risk premium' (higher interest rate)
    interest_rate = base_rate.copy()
    for i in range(n_samples):
        if race[i] == 'Black':
            interest_rate[i] += 2.5 # 2.5% penalty
        if gender[i] == 'Female':
            interest_rate[i] += 0.5 # 0.5% penalty

    # Clip to realistic bounds [3%, 30%]
    interest_rate = np.clip(interest_rate, 3.0, 30.0)
    
    df = pd.DataFrame({
        'income': income,
        'credit_score': credit_score,
        'loan_amount': loan_amount,
        'gender': gender,
        'race': race,
        'interest_rate': interest_rate
    })

    # Train a model on features (excluding protected attributes)
    X = df[['income', 'credit_score', 'loan_amount']]
    y = df['interest_rate']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42)
    model.fit(X_train, y_train)
    
    # Save Model
    joblib.dump(model, 'regression_model_testing/regression_model.pkl')
    
    # Save Sample
    test_df = df.iloc[X_test.index].copy()
    test_df.to_csv('regression_model_testing/regression_sample.csv', index=False)
    
    print(f"Created regression_model_testing/regression_model.pkl and regression_model_testing/regression_sample.csv")
    print(f"Mean Interest Rate - Black: {df[df['race']=='Black']['interest_rate'].mean():.2f}%")
    print(f"Mean Interest Rate - White: {df[df['race']=='White']['interest_rate'].mean():.2f}%")

if __name__ == "__main__":
    generate_regression_data()
