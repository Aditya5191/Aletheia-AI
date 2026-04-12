# Algorithm 1: Certifying and Removing Disparate Impact

## 1. Objective
Detect and remove disparate impact (bias) in algorithmic systems via data pre-processing. This allows organizations to certify fairness without requiring access to proprietary, black-box classifiers. It relies on the U.S. legal framework of the 80% rule.

## 2. Detection (Certification Algorithm)
Determines whether a dataset admits disparate impact by checking if the protected attribute is predictable.
**Mathematical Concept:** If no classifier can predict the protected attribute with a Balanced Error Rate (BER) smaller than a specific threshold ($\epsilon$), then the dataset is safe from disparate impact.

**Constants:** $\tau = 0.8$ (for the 80% rule).
**Inputs required:** 
- `X`: Binary protected attribute array (0=minority, 1=majority)
- `Y`: Target Feature matrix (MUST exclude X)
- `C`: Binary decision outcome labels (1=hire/approve)

**Pseudo-code Implementation:**
1. Compute the minority selection rate: `beta = mean(C[X == 0] == 1)`
2. Calculate the BER boundary limit: `epsilon_threshold = 0.5 - beta * (1/tau - 1) / 2`
3. Select an ML classifier (like SVM or Logistic Regression) strictly utilizing balanced class weights. Train it using `Y` to predict `X`.
4. Run predictions and calculate Balanced Error Rate:
   `BER = (FalsePositiveRate + FalseNegativeRate) / 2`
5. Evaluate: If the trained `BER >= epsilon_threshold`, the dataset is "Certified Fair". 

## 3. Mitigation (Geometric Repair Algorithm)
Transforms the feature matrix `Y` into `Y_repaired` so the protected attribute `X` becomes statistically unpredictable, explicitly mirroring distributions while preserving intra-group candidate ranking.

**Inputs required:**
- `Y`: Numerical Feature matrix
- `X`: Feature attribute vector
- `lambda`: Float [0, 1]. `0` is no repair, `1` is full uniform alignment repair.

**Pseudo-code Implementation:**
For every individual column (feature) in `Y`:
1. Split the feature data based on group $X=0$ and $X=1$.
2. Compute the Empirical Cumulative Distribution Function (CDF) for group 0, mapping values to quantiles. Get the inverse CDF mapping quantiles to values.
3. Compute the Empirical CDF for group 1. Get its inverse CDF.
4. Calculate a unified "Median Distribution" globally mapping each quantile step (0->1) to the median of group 0 and group 1's values at that exact quantile.
5. Apply the repair loop row by row:
   a. Capture original value `y` and its group label `x`.
   b. Identify `y`'s quantile rank strictly within its own group CDF.
   c. Discover the fully repaired value simply by looking up that group rank inside the new "Median Distribution". Let's call it `y_full_repair`.
   d. Assign the final array value via geometric interpolation: 
      `y_repaired = (1 - lambda) * y_original + lambda * y_full_repair`

## 4. Agent Coding Guidelines (Watch for bugs!)
- Make sure to inform users that this approach only mathematically handles numeric/ordinal arrays.
- Watch edge cases calculating the empirical CDF bounds at precisely 0 and 1; clip limits gently to prevent `inf` interpolation bugs.
- No external libraries other than basic matrix math are required if you opt to hand-code the CDF functions.
