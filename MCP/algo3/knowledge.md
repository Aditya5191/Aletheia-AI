# Algorithm 3: Fair Prediction with Disparate Impact (Recidivism)

## 1. Objective
Provide a rigorous diagnostic framework proving that when base rates (prevalence of actual positives) differ across groups, achieving predictive parity (equal PPV) mathematically forces an imbalance in False Positive Rates (FPR) and False Negative Rates (FNR). This algorithm diagnoses these theoretically impossible trade-offs and calibrates thresholds to explicitly choose a compromise.

## 2. Detection (The Impossibility Theorem Framework)
Detect conflicting statistical metrics and compute the mathematical error gap forced by varying prevalence.

**Important Mathematics (Equation 2.6 consistency):**
FPR is mathematically locked to Prevalence ($p$), PPV, and FNR via:
`FPR = (p / (1 - p)) * ((1 - PPV) / PPV) * (1 - FNR)`

**Inputs required:**
- `scores`: Continuous risk scores
- `y_true`: Ground truth
- `protected_attr`: Group identifiers
- `threshold`: A single global threshold for baseline classification
- `t_min` / `t_max`: Optional constants mapping expected policy penalty disparity

**Pseudo-code Implementation:**
1. Split the data tightly across each group.
2. For each group calculate:
   - Prevalence ($p$): `Mean(y_true == 1)`
   - Positive Predictive Value (PPV): `P(Y=1 | Score > threshold)`
   - FPR and FNR
3. Validate parity directly:
   - Does `max(PPV) - min(PPV) < tolerance`?
   - Does `max(FPR) - min(FPR) < tolerance`?
4. Calculate Theoretical Penalty Disparity ($\Delta$):
   `Delta = (t_max - t_min) * (FPR_reference_group - FPR_other_group)`
5. Verify Equation 2.6 using observed metrics vs theoretical metrics to ensure mathematical alignment.

## 3. Mitigation (Explicit Tradeoff Calibration)
By proving that simultaneous mathematical fairness is impossible, this calibration adjusts group-specific thresholds while explicitly relaxing constraints on one metric to guarantee fairness heavily on another.

**Inputs required:**
- `scores`, `y_true`, `protected_attr`
- `strategy`: Target optimization ("fpr_balance", "fnr_balance", strict "ppv_parity")

**Pseudo-code Implementation:**
1. Map out percentiles (0 to 100) of the risk scores to serve as candidate thresholds.
2. Loop over candidate threshold pairs `(t0, t1)`.
3. Compute PPV, FPR, and FNR for group 0 at `t0`, and group 1 at `t1`.
4. Apply the routing logic dictated heavily by the chosen `strategy`:
   - If `strategy == 'fpr_balance'`:
     `cost = abs(FPR_0 - FPR_1) + Penalty(abs(PPV_0 - PPV_1) - limit)`
   - If `strategy == 'fnr_balance'`:
     `cost = abs(FNR_0 - FNR_1) + Penalty(abs(PPV_0 - PPV_1) - limit)`
   - If `strategy == 'ppv_parity'`:
     `cost = abs(PPV_0 - PPV_1) + 0.5 * (abs(FPR_0 - FPR_1) + abs(FNR_0 - FNR_1))`
5. Select the `(t0, t1)` boundary pair that strictly minimizes the selected `cost`.
6. Enforce labels securely based on `t0` for group 0 and `t1` for group 1.

## 4. Agent Coding Guidelines
- Ensure that candidate threshold grids utilize dataset distribution percentiles (e.g., calculating the 5th through 95th percentiles of raw scores) locally rather than continuous blank boundaries to firmly guarantee realistic clusters.
- Because mathematical formulas require firm prevalence figures mapping non-zero constraints, code edge cases explicitly filtering groups returning perfectly pure label vectors (`P = 0` or `P = 1`), outputting `NaN` securely preventing application crashes.
