# Causal Explanation & Fair Policy Design

## Title
Fairness in Decision-Making: Causal Mechanism Decomposition & Narrow Tailoring Policy Optimization

## Overview
This implementation provides a causal inference framework for detecting, explaining, and mitigating algorithmic discrimination through counterfactual mechanism decomposition. Grounded in Zhang & Bareinboim (2018), the toolkit decomposes observed outcome disparity into direct, indirect, and spurious counterfactual effects, enabling precise attribution of discriminatory pathways. It further implements a policy optimization engine that designs reparatory interventions satisfying the legal "narrow tailoring" principle, ensuring disparity reduction without reverse discrimination.

## Problem Being Solved
Traditional fairness metrics treat disparity as a monolithic statistic, obscuring the underlying causal mechanisms (direct bias, mediated discrimination, historical confounding) and providing no principled guidance for targeted intervention. This library addresses the need for mechanism-specific fairness auditing, transparent disparity explanation, and legally compliant policy design that quantifies the exact trade-offs between procedural fairness, outcome parity, and predictive utility.

## Sector Suitability Analysis

### Hiring & HR
**Suitability**: HIGHLY SUITABLE  
**Justification**: 
- *Type of data required*: Applicant demographics, education, experience, interview scores, hiring outcomes
- *Bias type handled*: Algorithmic bias via direct discrimination (name/gender bias), indirect (education proxies), spurious (socioeconomic confounders)
- *Mediators involved*: Resume screening, interview panels, ATS ranking algorithms; decomposition maps directly to hiring pipeline stages
- *Note*: Aligns with EEOC disparate treatment/impact frameworks; narrow tailoring guides targeted outreach vs quota design

### Lending & Finance
**Suitability**: SUITABLE  
**Justification**:
- *Type of data required*: Credit history, income, debt ratios, ZIP code, protected attributes, default outcomes
- *Bias type handled*: Direct rate discrimination, indirect via credit history proxies, spurious via neighborhood redlining confounders
- *Mediators involved*: Underwriting models, risk pricing engines, compliance audit systems; causal paths map to regulatory reporting requirements
- *Note*: Requires careful causal graph specification to satisfy ECOA/Fair Lending standards; policy design supports affirmative lending programs

### Healthcare
**Suitability**: MODERATELY SUITABLE  
**Justification**:
- *Type of data required*: Clinical biomarkers, treatment history, SES indicators, demographic attributes, health outcomes
- *Bias type handled*: Direct treatment allocation bias, indirect via access-to-care mediators, spurious via insurance/SES confounders
- *Mediators involved*: Clinical decision support, triage protocols, resource allocation systems; requires clinical validation of causal pathways
- *Note*: Unmeasured confounding common in EHR data; counterfactual estimates sensitive to label reliability; narrow tailoring must balance equity vs clinical urgency

### Criminal Justice
**Suitability**: CONDITIONALLY SUITABLE  
**Justification**:
- *Type of data required*: Prior records, charge severity, demographics, geographic features, recidivism/bail outcomes
- *Bias type handled*: Direct sentencing bias, indirect via arrest frequency mediators, spurious via policing strategy confounders
- *Mediators involved*: Risk assessment tools, pretrial services, parole boards; causal decomposition exposes systemic feedback loops
- *Note*: Severe measurement bias in recidivism labels; unmeasured confounding likely; policy interventions require judicial oversight and community input

### Education
**Suitability**: SUITABLE  
**Justification**:
- *Type of data required*: Test scores, GPA, socioeconomic status, school district, demographic attributes, admission/retention outcomes
- *Bias type handled*: Direct admissions bias, indirect via school quality mediators, spurious via neighborhood funding confounders
- *Mediators involved*: Admissions committees, early alert systems, equity offices; decomposition aligns with Title IX/VI compliance auditing
- *Note*: Clear causal pathways; narrow tailoring supports targeted financial aid vs holistic review policies; institutional capacity for causal validation

### Summary Assessment
| Domain | Suitability | Primary Reason |
|--------|-------------|---------------|
| Hiring & HR | ★★★★★ | Clear causal pathways; legal alignment with disparate treatment/impact; narrow tailoring guides targeted interventions |
| Lending & Finance | ★★★★☆ | Regulatory compatibility; identifiable mediators/confounders; supports compliance audit trails |
| Education | ★★★★☆ | Transparent causal structure; institutional oversight; clear academic mediators |
| Healthcare | ★★★☆☆ | Unmeasured confounding common; outcome labels noisy; requires clinical validation of pathways |
| Criminal Justice | ★★☆☆☆ | Severe label bias; unmeasured confounding; violates core causal ignorability assumptions |

**Best Suited Domain(s)**: Hiring & HR, Lending & Finance, Education  
**Least Suitable Domain(s)**: Criminal Justice, Healthcare (without rigorous causal validation & sensitivity analysis)  
**Reasoning**: Domains with well-specified causal graphs, identifiable mediators/confounders, and reliable outcome labels benefit most. Domains with severe measurement bias, unmeasured confounding, or legally contested outcome definitions risk invalid counterfactual estimation and policy misalignment.

## Bias Coverage Analysis

| Bias Type               | Addressed?    | Explanation                                                                                                                                               |
| ----------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Statistical Bias**    | Yes           | Decomposes raw statistical disparity (TV) into causal components, enabling precise bias attribution                                                         |
| **Historical Bias**     | Yes           | Explicitly captures spurious discrimination via confounders (e.g., redlining, historical inequalities) through Ctf-SE                                       |
| **Representation Bias** | Partially     | Does not fix sampling imbalances but explains how unequal base rates interact with causal pathways to produce disparity                                     |
| **Measurement Bias**    | Conditionally | Assumes accurate measurement of X, W, Z, Y; biased labels or proxy measurements distort counterfactual estimates                                            |
| **Algorithmic Bias**    | Yes (Primary) | Core contribution: isolates direct, indirect, and spurious discriminatory mechanisms in automated decision systems                                          |
| **Evaluation Bias**     | Yes           | Replaces aggregate disparity metrics with mechanism-specific decomposition, preventing misleading fairness claims                                           |

## Features
- Counterfactual mechanism decomposition (Ctf-DE, Ctf-IE, Ctf-SE)
- Causal Explanation Formula verification and attribution reporting
- Observational identification via plug-in conditional probability estimation
- Narrow tailoring policy optimization for reparatory interventions
- Path-disabling simulation (direct, indirect, spurious) with disparity impact forecasting
- Bootstrap confidence intervals for mechanism estimates
- Comprehensive audit reporting compliant with disparate treatment/impact frameworks

## How the Algorithm Works
1. **Causal Specification**: Define sensitive attribute ($X$), mediators ($W$), confounders ($Z$), and outcome ($Y$)
2. **Model Fitting**: Estimate conditional probabilities $P(Y|X,W,Z)$, $P(W|X,Z)$, $P(Z|X)$ via logistic regression or empirical averaging
3. **Mechanism Estimation**: Compute Ctf-DE, Ctf-IE, Ctf-SE using identification formulas
4. **Decomposition Verification**: Verify $TV \approx SE + IE - DE$; compute attribution percentages
5. **Policy Design**: Calculate residual disparity $R = SE + IE$; determine feasible $DE_{new}$ region satisfying narrow tailoring
6. **Intervention Simulation**: Forecast post-policy disparity under direct disabling, confounder adjustment, or affirmative action
7. **Validation**: Report feasible policy ranges, disparity reduction metrics, and reverse discrimination safeguards

## Installation
```bash
pip install numpy pandas scikit-learn scipy
git clone https://github.com/yourorg/causal-explanation-fairness.git
cd causal-explanation-fairness