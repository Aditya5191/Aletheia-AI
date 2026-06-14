# Aletheia-AI Visualization Engine: Chart Schema Specification

This document defines the standardized JSON schemas used by Aletheia-AI agents to communicate visualization requirements to the frontend. Agents must strictly adhere to these structures to ensure successful rendering in the dashboard.

## Global Design Principles

- **Semantic Coloration**: Use the following palette for consistency:
  - Success/Neutral-Positive: `#9ECE6A` (Green)
  - Warning/Bias-High: `#F7768E` (Red)
  - Info/Primary: `#7AA2F7` (Blue)
  - Secondary/Variation: `#BB9AF7` (Purple)
  - Highlight: `#7DCFFF` (Cyan)
- **Plain English Explanations**: Every chart must include an `explanation` field that translates the statistical finding into a 1-2 sentence insight for non-technical stakeholders.
- **Dynamic Content**: While schemas are strict, data point counts should reflect actual audit results.

---

## 1. Bar Chart
**Strategic Intent**: Visualize direct comparisons of a single metric across discrete groups.
**Best Use Cases**: 
- Disparate Impact Ratio per demographic.
- False Positive Rate across racial or gender groups.

### Schema Definition
```json
{
  "type": "bar",
  "title": "string",
  "explanation": "string",
  "color": "hex_code",
  "data": [
    { "label": "string", "value": number }
  ]
}
```

### Reference Example
```json
{
  "type": "bar",
  "title": "Disparate Impact by Group",
  "explanation": "African American subjects show a significant negative deviation compared to Caucasian subjects, indicating potential bias in selection rates.",
  "color": "#9ECE6A",
  "data": [
    { "label": "Caucasian", "value": 0.85 },
    { "label": "African American", "value": -0.42 },
    { "label": "Hispanic", "value": 0.12 },
    { "label": "Asian", "value": 0.95 }
  ]
}
```

---

## 2. Grouped Bar Chart
**Strategic Intent**: Compare multiple metrics or "Before vs After" states across the same groups.
**Best Use Cases**:
- Baseline Bias vs. Post-Mitigation Bias.
- Precision vs. Recall across subgroups.

### Schema Definition
```json
{
  "type": "grouped_bar",
  "title": "string",
  "explanation": "string",
  "series": [
    { "name": "string", "color": "hex_code" }
  ],
  "data": [
    { "label": "string", "values": [number_series_1, number_series_2] }
  ]
}
```

### Reference Example
```json
{
  "type": "grouped_bar",
  "title": "Error Rates: Before vs After Mitigation",
  "explanation": "Mitigation efforts significantly reduced the error rate gap between Male and Female groups while maintaining overall performance.",
  "series": [
    { "name": "Before", "color": "#F7768E" },
    { "name": "After", "color": "#9ECE6A" }
  ],
  "data": [
    { "label": "Male", "values": [0.35, 0.15] },
    { "label": "Female", "values": [0.65, 0.18] },
    { "label": "Non-binary", "values": [0.55, 0.16] }
  ]
}
```

---

## 3. Stacked Bar Chart
**Strategic Intent**: Demonstrate the composition of a total value, showing how different factors contribute to a whole.
**Best Use Cases**:
- Bias contribution by feature (Direct vs Indirect effects).
- Error composition (False Positives vs False Negatives).

### Schema Definition
```json
{
  "type": "stacked_bar",
  "title": "string",
  "explanation": "string",
  "series": [
    { "name": "string", "color": "hex_code" }
  ],
  "data": [
    { "label": "string", "values": [num_part_1, num_part_2, num_part_3] }
  ]
}
```

### Reference Example
```json
{
  "type": "stacked_bar",
  "title": "Bias Contribution by Feature",
  "explanation": "Zip Code acts as a heavy proxy (Indirect Effect), while Education has a strong direct impact on the model's prediction.",
  "series": [
    { "name": "Direct Effect", "color": "#E3B341" },
    { "name": "Indirect Effect", "color": "#7AA2F7" },
    { "name": "Spurious Effect", "color": "#F7768E" }
  ],
  "data": [
    { "label": "Age", "values": [0.4, 0.2, 0.1] },
    { "label": "Zip Code", "values": [0.1, 0.7, 0.2] },
    { "label": "Education", "values": [0.5, 0.1, 0.0] }
  ]
}
```

---

## 4. Line Chart / Area Chart
**Strategic Intent**: Track trends over continuous variables or identify optimization thresholds.
**Best Use Cases**:
- Fairness-Accuracy tradeoff curves.
- Metric stability across different classification thresholds.

### Schema Definition
```json
{
  "type": "line",
  "title": "string",
  "explanation": "string",
  "xAxisLabel": "string",
  "yAxisLabel": "string",
  "series": [
    { "name": "string", "color": "hex_code" }
  ],
  "data": [
    { "x": number, "values": [y_val_series_1, y_val_series_2] }
  ]
}
```

### Reference Example
```json
{
  "type": "line",
  "title": "Fairness-Accuracy Tradeoff Curve",
  "explanation": "As we increase the threshold for Demographic Parity, the overall Accuracy drops, revealing the cost of strict fairness constraints.",
  "xAxisLabel": "Classification Threshold",
  "yAxisLabel": "Score",
  "series": [
    { "name": "Accuracy", "color": "#7DCFFF" },
    { "name": "Demographic Parity", "color": "#9ECE6A" }
  ],
  "data": [
    { "x": 0.1, "values": [0.55, 0.98] },
    { "x": 0.3, "values": [0.65, 0.85] },
    { "x": 0.5, "values": [0.75, 0.70] },
    { "x": 0.7, "values": [0.82, 0.40] },
    { "x": 0.9, "values": [0.85, 0.15] }
  ]
}
```

---

## 5. Scatter Plot
**Strategic Intent**: Reveal correlations between two continuous variables or identify individual outliers.
**Best Use Cases**:
- Risk Score Calibration (Predicted vs Actual).
- Feature importance vs. Individual bias impact.

### Schema Definition
```json
{
  "type": "scatter",
  "title": "string",
  "explanation": "string",
  "xAxisLabel": "string",
  "yAxisLabel": "string",
  "series": [
    { "name": "string", "color": "hex_code" }
  ],
  "data": [
    { "seriesIndex": number, "x": number, "y": number, "label": "point_id" }
  ]
}
```

### Reference Example
```json
{
  "type": "scatter",
  "title": "Risk Score Calibration",
  "explanation": "Group B shows higher actual default rates at lower predicted scores, suggesting the model underestimates risk for this group.",
  "xAxisLabel": "Predicted Risk Score",
  "yAxisLabel": "Actual Default Rate",
  "series": [
    { "name": "Group A", "color": "#7AA2F7" },
    { "name": "Group B", "color": "#F7768E" }
  ],
  "data": [
    { "seriesIndex": 0, "x": 0.2, "y": 0.15, "label": "ID_102" },
    { "seriesIndex": 1, "x": 0.8, "y": 0.85, "label": "ID_405" },
    { "seriesIndex": 0, "x": 0.5, "y": 0.45, "label": "ID_221" },
    { "seriesIndex": 1, "x": 0.3, "y": 0.55, "label": "ID_339" }
  ]
}
```

---

## 6. Box-and-Whisker Plot
**Strategic Intent**: Display statistical distribution, variance, and outliers across groups.
**Best Use Cases**:
- Distribution of prediction scores by demographic.
- Variance in causal impact across individual samples.

### Schema Definition
```json
{
  "type": "box_plot",
  "title": "string",
  "explanation": "string",
  "color": "hex_code",
  "data": [
    { 
      "label": "string", 
      "min": number, 
      "q1": number, 
      "median": number, 
      "q3": number, 
      "max": number, 
      "outliers": [number] 
    }
  ]
}
```

### Reference Example
```json
{
  "type": "box_plot",
  "title": "Prediction Variance by Demographic",
  "explanation": "Group 1 shows a much tighter distribution of scores, whereas Group 2 has significantly more outliers and higher variance.",
  "color": "#BB9AF7",
  "data": [
    { 
      "label": "Group 1", 
      "min": 0.1, 
      "q1": 0.3, 
      "median": 0.45, 
      "q3": 0.6, 
      "max": 0.8, 
      "outliers": [0.95, 0.05] 
    },
    { 
      "label": "Group 2", 
      "min": 0.2, 
      "q1": 0.4, 
      "median": 0.55, 
      "q3": 0.7, 
      "max": 0.85, 
      "outliers": [] 
    }
  ]
}
```

---

## 7. Heatmap (Correlation Matrix)
**Strategic Intent**: Identify systemic relationships and "proxy" features through multi-variable correlation.
**Best Use Cases**:
- Feature Correlation Matrix to detect Zip Code or Name as proxies for Race.
- Intersectional bias heatmaps (e.g., Race + Gender).

### Schema Definition
```json
{
  "type": "heatmap",
  "title": "string",
  "explanation": "string",
  "colorScale": ["hex_zero", "hex_positive", "hex_negative"],
  "xLabels": ["string"],
  "yLabels": ["string"],
  "data": [
    [number] // 2D Array
  ]
}
```

### Reference Example
```json
{
  "type": "heatmap",
  "title": "Feature Correlation Matrix",
  "explanation": "High correlation (0.88) between Zip Code and Race confirms Zip Code is acting as a proxy variable for demographic data.",
  "colorScale": ["#15171B", "#7AA2F7", "#F7768E"],
  "xLabels": ["Age", "Income", "Zip Code", "Race"],
  "yLabels": ["Age", "Income", "Zip Code", "Race"],
  "data": [
    [ 1.00,  0.45, -0.12,  0.05],
    [ 0.45,  1.00,  0.88,  0.75],
    [-0.12,  0.88,  1.00,  0.82],
    [ 0.05,  0.75,  0.82,  1.00]
  ]
}
```

---

## 8. Waterfall Chart
**Strategic Intent**: Narrative-driven visualization showing the step-by-step impact of mitigation actions.
**Best Use Cases**:
- Bias reduction journey from baseline to final model.
- Incremental contribution of features to a single prediction.

### Schema Definition
```json
{
  "type": "waterfall",
  "title": "string",
  "explanation": "string",
  "yAxisLabel": "string",
  "data": [
    { "label": "string", "value": number, "type": "total|delta", "color": "hex_code" }
  ]
}
```

### Reference Example
```json
{
  "type": "waterfall",
  "title": "Disparate Impact Mitigation Journey",
  "explanation": "Dropping the 'Zip Code' feature and reweighting the data successfully brought the Disparity Score to near-zero.",
  "yAxisLabel": "Disparity Score",
  "data": [
    { "label": "Baseline", "value": 0.45, "type": "total", "color": "#F7768E" },
    { "label": "Drop Zip Code", "value": -0.15, "type": "delta", "color": "#9ECE6A" },
    { "label": "Reweight Data", "value": -0.20, "type": "delta", "color": "#9ECE6A" },
    { "label": "Threshold Adj.", "value": -0.08, "type": "delta", "color": "#9ECE6A" },
    { "label": "Final Score", "value": 0.02, "type": "total", "color": "#7DCFFF" }
  ]
}
```

---

## Agent Implementation Guide

1. **Selection**: Choose the chart type that best fits the *Strategic Intent* described above.
2. **Precision**: Ensure numerical values are correctly computed within the sandbox before generating the JSON.
3. **Validation**: All JSON output must be valid and conform to the listed `Schema Definition`.
4. **Contextualization**: Always tailor the `explanation` to the specific dataset and findings of the audit.
