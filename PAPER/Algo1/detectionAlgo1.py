import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.utils import class_weight

def balanced_error_rate(y_true, y_pred):
    """
    Calculate Balanced Error Rate (BER) for binary classification.
    BER = (FPR + FNR) / 2 = average of class-conditioned error rates
    """
    # Confusion matrix components
    tp = np.sum((y_true == 1) & (y_pred == 1))
    tn = np.sum((y_true == 0) & (y_pred == 0))
    fp = np.sum((y_true == 0) & (y_pred == 1))
    fn = np.sum((y_true == 1) & (y_pred == 0))
    
    # Class-conditioned error rates
    error_class_0 = fp / (fp + tn) if (fp + tn) > 0 else 0  # FPR
    error_class_1 = fn / (fn + tp) if (fn + tp) > 0 else 0  # FNR
    
    return (error_class_0 + error_class_1) / 2


def calculate_disparate_impact_ratio(C, X, positive_class=1, majority_class=1):
    """
    Calculate disparate impact ratio: 
    Pr(C=positive | X=minority) / Pr(C=positive | X=majority)
    
    Returns ratio and whether it violates 80% rule (tau=0.8)
    """
    minority_class = 1 - majority_class
    
    # Selection rates
    rate_minority = np.mean(C[X == minority_class] == positive_class)
    rate_majority = np.mean(C[X == majority_class] == positive_class)
    
    # Avoid division by zero
    if rate_majority == 0:
        return float('inf') if rate_minority > 0 else 1.0
    
    di_ratio = rate_minority / rate_majority
    violates_80_rule = di_ratio < 0.8
    
    return di_ratio, violates_80_rule


class BEROptimizedClassifier(BaseEstimator, ClassifierMixin):
    """
    Wrapper for sklearn classifiers that optimizes for Balanced Error Rate
    by applying class weights inversely proportional to class frequencies.
    """
    def __init__(self, base_classifier='svm', C=1.0, max_iter=1000):
        self.base_classifier = base_classifier
        self.C = C
        self.max_iter = max_iter
        self.model = None
        
    def _get_model(self):
        """Initialize base classifier with BER-optimizing class weights"""
        if self.base_classifier == 'svm':
            return SVC(kernel='linear', C=self.C, class_weight='balanced', 
                      max_iter=self.max_iter, random_state=42)
        elif self.base_classifier == 'logistic':
            return LogisticRegression(C=self.C, class_weight='balanced', 
                                     max_iter=self.max_iter, random_state=42)
        elif self.base_classifier == 'naive_bayes':
            return GaussianNB()
        else:
            raise ValueError(f"Unsupported classifier: {self.base_classifier}")
    
    def fit(self, X, y):
        self.model = self._get_model()
        self.model.fit(X, y)
        return self
    
    def predict(self, X):
        return self.model.predict(X)
    
    def score(self, X, y):
        # Override default accuracy score with BER (lower is better, so negate)
        predictions = self.predict(X)
        return -balanced_error_rate(y, predictions)  # Negative for optimization


def certify_disparate_impact(X, Y, C, tau=0.8, classifier='svm', 
                            test_size=0.3, random_state=42):
    """
    Certify whether dataset admits disparate impact based on 
    predictability of protected attribute.
    
    Parameters:
    -----------
    X : array-like, shape (n_samples,)
        Protected attribute values (binary: 0=minority, 1=majority)
    Y : array-like, shape (n_samples, n_features)
        Feature matrix (protected attribute should be excluded)
    C : array-like, shape (n_samples,)
        Binary outcome labels (e.g., hire/deny)
    tau : float, default=0.8
        Disparate impact threshold (80% rule)
    classifier : str, default='svm'
        Base classifier for BER optimization: 'svm', 'logistic', or 'naive_bayes'
    test_size : float, default=0.3
        Proportion of data for held-out evaluation
    random_state : int, default=42
        Random seed for reproducibility
        
    Returns:
    --------
    dict : Certification results including BER, threshold, and fairness decision
    """
    X = np.asarray(X).ravel()
    Y = np.asarray(Y)
    C = np.asarray(C).ravel()
    
    # Step 1: Estimate beta = minority group selection rate
    minority_class = 0  # Convention: 0 = minority/protected
    positive_class = 1  # Convention: 1 = positive outcome
    
    beta = np.mean(C[X == minority_class] == positive_class)
    
    # Step 2: Compute BER threshold from Theorem 4.1
    epsilon_threshold = 0.5 - beta * (1/tau - 1) / 2
    
    # Step 3: Split data for evaluation
    Y_train, Y_test, X_train, X_test = train_test_split(
        Y, X, test_size=test_size, random_state=random_state, stratify=X
    )
    
    # Step 4: Train BER-optimized classifier to predict protected attribute
    model = BEROptimizedClassifier(base_classifier=classifier)
    model.fit(Y_train, X_train)
    
    # Step 5: Evaluate BER on held-out data
    predictions = model.predict(Y_test)
    ber_achieved = balanced_error_rate(X_test, predictions)
    
    # Step 6: Certification decision
    certified_fair = ber_achieved >= epsilon_threshold
    
    # Additional metrics for transparency
    di_ratio, violates_rule = calculate_disparate_impact_ratio(C, X, 
                                                              positive_class, 
                                                              majority_class=1)
    
    return {
        'certified_fair': certified_fair,
        'ber_achieved': ber_achieved,
        'ber_threshold': epsilon_threshold,
        'beta_minority_selection_rate': beta,
        'disparate_impact_ratio': di_ratio,
        'violates_80_percent_rule': violates_rule,
        'classifier_used': classifier,
        'recommendation': 'PASS' if certified_fair else 'REVIEW_REQUIRED'
    }