# Algorithm 2: Equality of Opportunity in Supervised Learning

## 1. Objective
Achieve fairness by post-processing the output scores of any pre-trained machine learning model without retraining. This method enforces Equal Opportunity (equal True Positive Rates) or Strict Equalized Odds (equal True Positive Rates AND equal False Positive Rates) across different demographic groups.

## 2. Detection (Equalized Odds Difference)
Quantify the disparity in how the model treats different demographic groups when predicting positive/negative outcomes.

**Metrics Used:**
- True Positive Rate (TPR): `P(Score > Threshold | Y_true = 1)`
- False Positive Rate (FPR): `P(Score > Threshold | Y_true = 0)`

**Inputs required:**
- `y_true`: Array of actual integer labels
- `y_pred`: Array of predicted integer labels (using the model's default threshold)
- `protected_attr`: Array identifying group membership for each prediction

**Pseudo-code Implementation:**
1. Isolate predictions based on group identities (e.g., group 0 vs group 1).
2. For each group, compute:
   - `TPR = True Positives / Total Actual Positives`
   - `FPR = False Positives / Total Actual Negatives`
3. Check Parities:
   - Equal Opportunity Violation = `abs(TPR_group0 - TPR_group1)`
   - Equalized Odds Violation = `abs(TPR_group0 - TPR_group1) + abs(FPR_group0 - FPR_group1)`

## 3. Mitigation (Threshold Optimization)
Identifies the optimal distinct classification threshold for *each* demographic group to force their TPRs (and optionally FPRs) to exactly match, minimizing overall prediction loss.

**Inputs required:**
- `scores`: Raw probabilities or real-valued continuous output from the model
- `y_true`: Ground truth labels
- `protected_attr`: Group identifiers
- `loss_ratio`: A float penalizing false positives vs false negatives (default 1.0)
- `mitigation_mode`: 'equal_opportunity' (TPR only) or 'equalized_odds' (TPR + FPR penalty)

**Pseudo-code Implementation:**
1. Build a grid of candidate thresholds (from 0.0 to 1.0, e.g., 100 steps).
2. For each possible threshold combination across groups (e.g., `t0` for group 0, `t1` for group 1):
   a. Sub-divide the data by `protected_attr`.
   b. Compute `TPR_0(t0)`, `FPR_0(t0)`, `FNR_0(t0)`, `FPR_0(t0)`
   c. Compute `TPR_1(t1)`, `FPR_1(t1)`, `FNR_1(t1)`, `FPR_1(t1)`
3. Compute the Fairness Constraint Violation:
   - If enforcing Equal Opportunity: `violation = abs(TPR_0 - TPR_1)`
   - If enforcing Equalized Odds: `violation = abs(TPR_0 - TPR_1) + abs(FPR_0 - FPR_1)`
4. Compute the Loss Score (error rate):
   `total_loss = (False_Positives_0 + False_Positives_1) * loss_ratio + (False_Negatives_0 + False_Negatives_1)`
5. Objective: Pick the specific `(t0, t1)` pair that has a `violation < tolerance` (e.g., `< 0.05`) while achieving the absolute MINIMUM `total_loss`.
6. Return the tuned array of group-specific thresholds and the newly predicted labels using those thresholds.

## 4. Agent Coding Guidelines
- Be cautious of groups with strictly zero positive or zero negative actual ground truths (`Y=1` or `Y=0`); denominators can be 0. Protect division by zero with `if (TP+FN) > 0` checks yielding computational `NaN` securely.
- When searching combinations `(t0, t1)`, checking an exhaustive grid limits computation. Loop efficiency in your programmatic logic is absolutely essential. Employ vectorized masking operations strictly over raw iteration loops if building this natively in Python.
