# Disparate Impact Certification and Removal

## Title
Certifying and Removing Disparate Impact: A Pre-processing Framework for Algorithmic Fairness

## Overview
This implementation provides tools to detect and mitigate disparate impact in machine learning datasets, based on the methodology from Feldman et al. (2015). The framework operates under the U.S. legal standard of disparate impact (the "80% rule") and enables organizations to certify fairness without accessing proprietary algorithms, and to repair data to eliminate discriminatory outcomes while preserving predictive utility.

## Problem Being Solved
Algorithms used in high-stakes domains (hiring, lending, criminal justice) may produce discriminatory outcomes even when protected attributes are not explicitly used, due to correlations with proxy features. This package addresses:
1. **Certification**: Determine whether a dataset could admit disparate impact under any classifier
2. **Mitigation**: Transform features to eliminate disparate impact while preserving rank-order information relevant to prediction

## Sector Suitability Analysis

### Hiring & HR
**Suitability**: HIGHLY SUITABLE  
**Justification**: 
- *Data Type*: Structured applicant data (test scores, education, experience) aligns with numerical/ordered feature assumption
- *Bias Type*: Directly addresses historical bias in hiring outcomes and algorithmic bias via proxy features (e.g., school prestige correlating with race)
- *Mediators*: HR systems often use black-box screening tools; pre-processing approach enables fairness without modifying proprietary models
- *Legal Alignment*: Framework matches U.S. employment law (Griggs v. Duke Power, EEOC guidelines)

### Lending & Finance
**Suitability**: SUITABLE WITH CAUTION  
**Justification**:
- *Data Type*: Credit scores, income, debt ratios are numerical and ordered; categorical variables require preprocessing
- *Bias Type*: Addresses redlining and indirect discrimination via ZIP code or transaction history proxies
- *Mediators*: Regulatory requirements (ECOA, Fair Lending) mandate disparate impact analysis; certification provides auditable evidence
- *Caveat*: Utility loss may affect risk assessment accuracy; partial repair (λ<1) recommended to balance fairness and business needs

### Healthcare
**Suitability**: MODERATELY SUITABLE  
**Justification**:
- *Data Type*: Clinical measurements are numerical, but complex interactions and missing data pose challenges
- *Bias Type*: Mitigates historical bias in diagnostic labels and representation bias in training data
- *Mediators*: Clinical decision support requires high accuracy; full repair may degrade utility for critical predictions
- *Recommendation*: Use partial repair with careful validation; supplement with clinical expertise to assess fairness/accuracy tradeoffs

### Criminal Justice
**Suitability**: LIMITED SUITABILITY  
**Justification**:
- *Data Type*: Risk assessment features often include categorical variables (charge type, prior record) requiring transformation
- *Bias Type*: Addresses historical bias in arrest/conviction data and algorithmic bias via proxy features
- *Mediators*: High-stakes decisions with limited recourse; utility loss may disproportionately affect marginalized groups if model accuracy drops
- *Critical Concern*: Labels (recidivism) may reflect policing bias rather than true risk; repair cannot correct fundamentally flawed outcomes

### Education
**Suitability**: SUITABLE  
**Justification**:
- *Data Type*: Test scores, GPA, demographic features are well-suited to quantile-based repair
- *Bias Type*: Mitigates disparate impact in admissions or resource allocation based on socioeconomic proxies
- *Mediators*: Institutional review processes can evaluate fairness/utility tradeoffs; partial repair enables incremental adoption
- *Example Use Case*: Repairing standardized test score distributions across demographic groups while preserving relative ranking

### Summary Assessment
| Domain | Suitability | Primary Reason |
|--------|-------------|---------------|
| Hiring & HR | ★★★★★ | Strong legal alignment; structured numerical data; black-box model compatibility |
| Lending & Finance | ★★★★☆ | Regulatory fit; numerical features; requires utility monitoring |
| Education | ★★★★☆ | Ordered features; institutional oversight; partial repair flexibility |
| Healthcare | ★★★☆☆ | Clinical accuracy priorities; complex data types; requires domain validation |
| Criminal Justice | ★★☆☆☆ | Label validity concerns; high-stakes utility tradeoffs; categorical feature challenges |

**Best Suited Domain(s)**: Hiring & HR, Lending & Finance  
**Least Suitable Domain(s)**: Criminal Justice, Healthcare (without extensive validation)  
**Reasoning**: Domains with structured numerical features, clear legal frameworks for disparate impact, and tolerance for fairness/utility tradeoffs benefit most. Domains with high-stakes accuracy requirements or fundamentally biased outcome labels require additional safeguards beyond pre-processing.

## Features
- **Certification Module**: Test datasets for potential disparate impact using BER-optimized classifiers
- **Repair Module**: Transform features to eliminate disparate impact via geometric or combinatorial methods
- **Partial Repair Support**: Tune fairness/utility tradeoff with λ parameter (0=no repair, 1=full repair)
- **Multiple Classifier Support**: SVM, Logistic Regression, Naive Bayes for certification
- **Multi-Attribute Handling**: Repair over joint distributions of multiple protected attributes
- **Diagnostic Metrics**: Report disparate impact ratio, BER, selection rates, and certification status

## How the Algorithm Works

### Certification (Detection)
1. Estimate minority group selection rate (β) from outcome labels
2. Compute BER threshold: ε = 0.5 - β/8 (for τ=0.8)
3. Train classifier to predict protected attribute from other features, optimizing BER
4. If achieved BER ≥ threshold → certify dataset as fair; else flag for review

### Mitigation (Repair)
1. For each feature, compute conditional distributions per protected group
2. Construct "median distribution" as quantile-wise median across groups
3. Transform each value to maintain its rank position within the median distribution
4. For partial repair: interpolate between original and fully-repaired values using λ

## Installation
```bash
# Clone repository
git clone https://github.com/yourorg/disparate-impact-toolkit.git
cd disparate-impact-toolkit

# Install dependencies
pip install -r requirements.txt

# Optional: Install development dependencies
pip install -e ".[dev]"