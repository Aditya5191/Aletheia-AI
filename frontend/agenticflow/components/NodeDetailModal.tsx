"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { API_BASE_URL } from "../lib/config";
import {
  X,
  Database,
  Brain,
  Code,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  FileText,
  Activity,
  Maximize2,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  Play,
  Hash,
  Download,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { useViewMode } from "./ViewModeContext";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NodeDetailModalProps {
  nodeId: string;
  onClose: () => void;
  forceTestMode?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Chart data per node                                                */
/* ------------------------------------------------------------------ */

interface ChartPoint {
  label: string;
  value: number;
}

/** Format a chart value to 2 decimal places (if fractional) */
function fmtVal(v: number | string): string {
  const n = Number(v);
  if (isNaN(n)) return String(v);
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

interface ChartDef {
  id?: string;
  label?: string;
  title?: string;
  type?: "line" | "bar" | "grouped_bar" | "stacked_bar" | "box_plot" | "pie" | "heatmap" | "scatter";
  data: any[]; 
  color?: string;
  xLabels?: string[];
  yLabels?: string[];
  colorScale?: string[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  series?: {name: string, color: string}[];
}

interface NodeDetailData {
  title: string;
  iconType: "database" | "brain" | "code";
  statusLabel: string;
  statusColor: string;
  charts: ChartDef[];
  metrics: { label: string; value: string; change?: string; up?: boolean }[];
  findings: { severity: "success" | "warning" | "error"; text: string }[];
  review: string;
  codeSnippet: string;
  lastRun: string;
}

const nodeDetails: Record<string, NodeDetailData> = {
  "data-inspector": {
    title: "Data Inspector",
    iconType: "database",
    statusLabel: "Idle",
    statusColor: "#958ea0",
    charts: [
      {
        id: "disparity_score",
        label: "Disparity Trend",
        type: "line",
        color: "#ffea7f", // warning yellow
        data: [
          { label: "v1.0", value: 0.42 },
          { label: "v1.1", value: 0.38 },
          { label: "v1.2", value: 0.45 },
          { label: "v2.0", value: 0.28 },
          { label: "v2.1", value: 0.25 },
          { label: "v2.2", value: 0.22 },
          { label: "v3.0", value: 0.15 },
        ],
      },
      {
        id: "feature_variance",
        label: "Feature Imbalance",
        type: "bar",
        color: "#d0bcff", // primary purple
        data: [
          { label: "Income", value: 68 },
          { label: "Age", value: 45 },
          { label: "Education", value: 32 },
          { label: "Region", value: 18 },
          { label: "Marital", value: 12 },
        ],
      },
      {
        id: "gender_representation",
        label: "Demographics",
        type: "pie",
        color: "#00d6ff", // tertiary blue
        data: [
          { label: "Male", value: 65200 },
          { label: "Female", value: 31400 },
          { label: "Non-binary", value: 1800 },
          { label: "Undisclosed", value: 5400 },
        ],
      },
    ],
    metrics: [
      { label: "Total Samples", value: "103,800", change: "+14.2%", up: true },
      { label: "Disparity Score", value: "0.15", change: "-0.07", up: true },
      { label: "Missing Values", value: "2.4%", change: "-1.1%", up: true },
      { label: "Imbalanced Feats", value: "2", change: "-1", up: true },
    ],
    findings: [
      { severity: "warning", text: "Income feature shows significant skew towards >$100k bracket (68% imbalance)" },
      { severity: "error", text: "Gender representation is highly skewed (Male 63%, Female 30%)" },
      { severity: "success", text: "Overall Disparity Score improved by 0.07 compared to dataset v2.2" },
      { severity: "success", text: "Missing value imputation successful across 99% of sparse features" },
    ],
    review:
      "The Data Inspector has completed analysis on dataset v3.0. While the overall Disparity Score has improved to 0.15, significant feature imbalances remain. The 'Income' feature is heavily skewed toward upper brackets, and the 'Gender' feature shows a 2:1 ratio of Male to Female records. It is recommended to apply synthetic minority over-sampling (SMOTE) or gather targeted data before feeding this into the Bias Detector.",
    codeSnippet: `import pandas as pd
import numpy as np
import logging
from typing import Dict, Any

logger = logging.getLogger("agent.data_inspector")

def analyze_disparity(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Generated by Agent 1: Data Inspector
    Analyzes demographic disparities and class imbalances in source data.
    
    Args:
        df: The raw ingested dataframe.
    Returns:
        Dictionary containing disparity scores and variance metrics.
    """
    logger.info(f"Starting analysis on {len(df)} records")
    
    # Calculate Disparity Score based on protected classes
    majority_class = df['income'].value_counts().max()
    minority_class = df['income'].value_counts().min()
    disparity_score = float(1.0 - (minority_class / majority_class))
    
    # Identify feature variance & imbalances
    imbalances = {}
    for col in df.select_dtypes(include=['object', 'category']):
        counts = df[col].value_counts(normalize=True)
        if counts.iloc[0] > 0.6: # Flag if dominant class > 60%
            imbalances[col] = round(counts.iloc[0] * 100, 2)
            
    # Calculate dataset metrics
    metrics = {
        "disparity_score": round(disparity_score, 2),
        "imbalanced_features": imbalances,
        "missing_ratio": float(df.isnull().mean().mean() * 100)
    }
    
    logger.info(f"Analysis complete. Disparity Score: {metrics['disparity_score']}")
    return metrics`,
    lastRun: "5 minutes ago",
  },
  "fairness-adjudicator": {
    title: "Agent Auditor",
    iconType: "brain",
    statusLabel: "Completed",
    statusColor: "#ff5252",
    charts: [
      {
        id: "dir_chart",
        label: "Approval Rates by Group",
        type: "bar",
        color: "#ff5252",
        data: [
          { label: "Privileged", value: 85 },
          { label: "Unprivileged", value: 45 },
        ],
      },
    ],
    metrics: [
      { label: "Disparate Impact (DIR)", value: "0.81", change: "Favors Privileged", up: false },
      { label: "Statistical Parity (SPD)", value: "-0.15", change: "Action Needed", up: false },
      { label: "Equal Opportunity", value: "-0.08", change: "Marginal", up: false },
      { label: "False Pos. Diff", value: "0.04", change: "Acceptable", up: true },
    ],
    findings: [
      { severity: "warning", text: "Disparate Impact Ratio (DIR): 0.81. The model strongly favors the privileged group." },
      { severity: "warning", text: "Statistical Parity Difference (SPD): -0.15. There is a noticeable difference in selection rates." },
      { severity: "warning", text: "Equal Opportunity Difference (EOD): -0.08. True positive rates slightly lag for the unprivileged group." },
    ],
    review:
      "**Bias Audit Report**\n\nDataset Profile Reviewed: `/workspace/data.csv`\nProtected Attributes: Gender, Age\n\n**Verdict**: The dataset exhibits historical bias against the unprivileged group. Remediation techniques like Reweighing or Adversarial Debiasing are highly recommended. Plots such as `dir_bar_chart.png` have been generated showing approval rates heavily skewing towards the privileged cohort.",
    codeSnippet: `import warnings; warnings.filterwarnings("ignore")
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix

def compute_fairness_metrics(df, protected_attr, target):
    # Apply encoding/imputation rules
    df = df.fillna(df.median(numeric_only=True))
    
    # Identify privileged and unprivileged groups
    privileged = df[df[protected_attr] == 1]
    unprivileged = df[df[protected_attr] == 0]
    
    # Compute metrics
    # Disparate Impact Ratio (DIR)
    dir_metric = (unprivileged[target].mean()) / (privileged[target].mean())
    
    # Statistical Parity Difference (SPD)
    spd_metric = unprivileged[target].mean() - privileged[target].mean()
    
    return {"DIR": dir_metric, "SPD": spd_metric}

df = pd.read_csv('/workspace/data.csv')
metrics = compute_fairness_metrics(df, 'gender', 'approved')

# Generate Plots
plt.figure(figsize=(8,6))
sns.barplot(x=['Privileged', 'Unprivileged'], y=[0.85, 0.45], palette=['#6B5996', '#ff5252'])
plt.title('Approval Rates by Group')
plt.savefig('/workspace/outputs/dir_bar_chart.png')

print("Audit complete. Plots generated and saved to /workspace/outputs/agent2.md")`,
    lastRun: "Just now",
  },
  "mitigation-expert": {
    title: "Mitigation Expert",
    iconType: "code",
    statusLabel: "Running",
    statusColor: "#d0bcff",
    charts: [
      {
        id: "mitigation_results",
        label: "Fairness Improvement (DIR)",
        type: "bar",
        color: "#d0bcff",
        data: [
          { label: "Before Mitigation", value: 81 },
          { label: "After Reweighing", value: 98 },
          { label: "After Adv. Debiasing", value: 96 },
        ],
      },
    ],
    metrics: [
      { label: "DIR Delta", value: "+21%", change: "Significant", up: true },
      { label: "Accuracy Loss", value: "0.4%", change: "Negligible", up: false },
      { label: "Sample Weights", value: "1250", change: "Applied", up: true },
    ],
    findings: [
      { severity: "success", text: "Reweighing technique successfully neutralized Gender disparity." },
      { severity: "success", text: "DIR improved from 0.81 to 0.98 (Ideal range: 0.8 - 1.2)." },
      { severity: "success", text: "Statistical Parity Difference reduced to -0.02." },
    ],
    review:
      "**Mitigation Strategy Report**\n\n**Strategy Applied**: Reweighing (Pre-processing)\n\nThe agent applied sample reweighing to the training dataset. By assigning higher weights to unprivileged groups with positive outcomes and lower weights to privileged groups with positive outcomes, we've successfully balanced the selection rates without significant loss in model performance (only 0.4% accuracy drop).",
    codeSnippet: `from aif360.algorithms.preprocessing import Reweighing
from aif360.datasets import BinaryLabelDataset

def apply_mitigation(df):
    # Convert to AIF360 format
    dataset = BinaryLabelDataset(df=df, label_name='approved', protected_attribute_names=['gender'])
    
    # Initialize Reweighing
    RW = Reweighing(unprivileged_groups=[{'gender': 0}], privileged_groups=[{'gender': 1}])
    
    # Fit and transform
    dataset_transf = RW.fit_transform(dataset)
    
    return dataset_transf.instance_weights

print("Mitigation complete. New sample weights calculated.")`,
    lastRun: "Running...",
  },
  "report-writer": {
    title: "Report Writer",
    iconType: "code",
    statusLabel: "Completed",
    statusColor: "#4edea3",
    charts: [],
    metrics: [],
    findings: [],
    review:
      "**Report Compiler**\n\nThe Report Writer agent reads every output produced by the three previous agents, renders all chart JSON data as publication-quality matplotlib figures, and compiles everything into a single aesthetically polished PDF report.\n\nOnce the PDF is ready, use the Download button above to save it locally.",
    codeSnippet: "",
    lastRun: "Just now",
  },
  "output-formatter": {
    title: "Output Formatter",
    iconType: "code",
    statusLabel: "Idle",
    statusColor: "#958ea0",
    charts: [
      {
        id: "payload_size",
        label: "Avg Payload Size (KB)",
        type: "line",
        color: "#00d6ff", // tertiary blue
        data: [
          { label: "Run 1", value: 28 },
          { label: "Run 2", value: 45 },
          { label: "Run 3", value: 32 },
          { label: "Run 4", value: 61 },
          { label: "Run 5", value: 55 },
          { label: "Run 6", value: 72 },
          { label: "Run 7", value: 68 },
        ],
      },
      {
        id: "status_codes",
        label: "Response Status Codes",
        type: "pie",
        color: "#4edea3",
        data: [
          { label: "200 OK", value: 8441 },
          { label: "400 Bad Req", value: 12 },
          { label: "429 Rate Lim", value: 45 },
          { label: "500 Server", value: 3 },
        ],
      },
    ],
    metrics: [
      { label: "Payloads Sent", value: "8,441", change: "+9.1%", up: true },
      { label: "Avg. Payload", value: "51.6KB", change: "+3.2KB", up: true },
      { label: "Success Rate", value: "99.8%", change: "+0.1%", up: true },
      { label: "Endpoint Errors", value: "3", change: "-5", up: false },
    ],
    findings: [
      { severity: "success", text: "REST endpoint schema validation passing at 99.8%" },
      { severity: "success", text: "All payloads under the 512KB size limit" },
      { severity: "warning", text: "3 timeout errors on endpoint /api/v2/ingest — retried successfully" },
      { severity: "success", text: "Content-Type headers correctly set for all outbound calls" },
    ],
    review:
      "The Output Formatter is performing reliably with a 99.8% success rate across 8,441 payloads. Average payload size has grown slightly to 51.6KB, well within the 512KB limit. Three timeout errors were recorded on the /api/v2/ingest endpoint but were resolved via automatic retry. Schema validation continues to pass consistently. No action required.",
    codeSnippet: `import json
import requests
from typing import Dict, Any

def format_and_dispatch(analyzed_data: Dict[str, Any], endpoint: str):
    """
    Generated by Agent 1: Output Formatter
    Prepares payload and dispatches to downstream webhook.
    """
    # Ensure schema compliance
    payload = {
        "timestamp": analyzed_data.get("timestamp"),
        "status": "PROCESSED",
        "metrics": analyzed_data.get("metrics", {}),
        "flags": analyzed_data.get("findings", [])
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-Agent-ID": "agent-1-output"
    }
    
    # Serialize and dispatch
    serialized = json.dumps(payload)
    response = requests.post(
        endpoint, 
        data=serialized, 
        headers=headers,
        timeout=5.0
    )
    
    return response.status_code`,
    lastRun: "2 minutes ago",
  },
};

/* ------------------------------------------------------------------ */
/*  Interactive SVG Charts                                             */
/* ------------------------------------------------------------------ */

function InteractiveLineChart({ chartDef }: { chartDef: ChartDef }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const data = chartDef.data;
  const chartColor = chartDef.color;

  const W = 560;
  const H = 280; // Increased for rotated labels
  const PAD_X = 40;
  const PAD_TOP = 30;
  const PAD_BOTTOM = 70;
  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  // Extract values safely, filtering out non-numeric data
  const values = data.map((d: any) => parseFloat(d.value)).filter((v: number) => !isNaN(v));
  
  const maxVal = values.length > 0 ? Math.max(...values, 1) : 1;
  const minVal = values.length > 0 ? Math.min(...values, 0) : 0;
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: PAD_X + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD_TOP + chartH - ((d.value - minVal) / range) * chartH,
  }));

  // Build area path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD_TOP + chartH} L ${points[0].x} ${PAD_TOP + chartH} Z`;

  return (
    <div>
      {/* Chart container with dynamic ID for gradients */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD_TOP + chartH * (1 - frac);
          const rawVal = minVal + range * frac;
          // Format based on magnitude
          const val = maxVal < 10 ? rawVal.toFixed(2) : Math.round(rawVal);
          
          return (
            <g key={frac}>
              <line
                x1={PAD_X}
                y1={y}
                x2={W - PAD_X}
                y2={y}
                stroke="rgba(149,142,160,0.1)"
                strokeDasharray="4 4"
              />
              <text
                x={PAD_X - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-outline text-[10px]"
              >
                {fmtVal(rawVal)}
              </text>
            </g>
          );
        })}

        {/* Gradient */}
        <defs>
          <linearGradient id={`areaGrad-${chartDef.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
          </linearGradient>
          <filter id={`chartGlow-${chartDef.id}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#areaGrad-${chartDef.id})`}
          className="transition-all duration-500 ease-out"
          style={{ animation: "drawLineX 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={chartColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#chartGlow-${chartDef.id})`}
          className="transition-all duration-500 ease-out"
          style={{ animation: "drawLineX 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}
        />

        {/* Interactive columns */}
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoveredIdx(i)}>
            {/* Invisible hover area */}
            <rect
              x={p.x - chartW / data.length / 2}
              y={PAD_TOP}
              width={chartW / data.length}
              height={chartH}
              fill="transparent"
              className="cursor-pointer"
            />

            {/* Vertical guide line */}
            {hoveredIdx === i && (
              <line
                x1={p.x}
                y1={PAD_TOP}
                x2={p.x}
                y2={PAD_TOP + chartH}
                stroke="rgba(208,188,255,0.3)"
                strokeDasharray="4 2"
              />
            )}

            {/* Dot */}
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === i ? 5 : 3}
              fill={hoveredIdx === i ? "#fff" : chartColor}
              stroke="#111317"
              strokeWidth="2"
              className="transition-all duration-300 ease-out pointer-events-none"
              style={{
                opacity: 0,
                animation: `fadeIn 0.4s ease-out forwards ${0.6 + i * 0.05}s`
              }}
            />

            {/* Tooltip */}
            {hoveredIdx === i && (
              <g className="pointer-events-none">
                <rect
                  x={p.x - 36}
                  y={p.y - 34}
                  width={72}
                  height={24}
                  rx={6}
                  fill="#282a2e"
                  stroke="#494454"
                  strokeWidth="1"
                />
                <text
                  x={p.x}
                  y={p.y - 18}
                  textAnchor="middle"
                  className="text-[11px] font-semibold"
                  style={{ fill: chartColor }}
                >
                  {fmtVal(data[i].value)}
                </text>
              </g>
            )}

            {/* X labels */}
            <text
              x={p.x}
              y={PAD_TOP + chartH + 16}
              textAnchor="end"
              transform={`rotate(-40 ${p.x} ${PAD_TOP + chartH + 16})`}
              className="fill-outline text-[9px]"
            >
              {data[i].label.length > 20 ? data[i].label.substring(0, 18) + ".." : data[i].label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function InteractiveBarChart({ chartDef }: { chartDef: ChartDef }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const data = chartDef.data;
  const chartColor = chartDef.color;

  const W = 560;
  const H = 280; // Increased for rotated labels
  const PAD_X = 40;
  const PAD_TOP = 30;
  const PAD_BOTTOM = 70;
  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  // Extract values safely, filtering out non-numeric data
  const values = data.map((d: any) => parseFloat(d.value)).filter((v: number) => !isNaN(v));
  
  const maxValRaw = values.length > 0 ? Math.max(...values, 0) : 0;
  const minValRaw = values.length > 0 ? Math.min(...values, 0) : 0;
  const rangeRaw = maxValRaw - minValRaw || 1;
  const maxVal = maxValRaw + (maxValRaw > 0 ? rangeRaw * 0.1 : 0);
  const minVal = minValRaw - (minValRaw < 0 ? rangeRaw * 0.1 : 0);
  const totalRange = maxVal - minVal || 1;

  const zeroY = PAD_TOP + chartH * (maxVal / totalRange);
  const barWidth = Math.min(40, (chartW / data.length) * 0.6);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD_TOP + chartH * (1 - frac);
          const rawVal = minVal + totalRange * frac;
          const val = Math.abs(rawVal) < 10 ? rawVal.toFixed(2) : Math.round(rawVal).toString();
          
          return (
            <g key={frac}>
              <line
                x1={PAD_X}
                y1={y}
                x2={W - PAD_X}
                y2={y}
                stroke="rgba(149,142,160,0.1)"
                strokeDasharray="4 4"
              />
              <text
                x={PAD_X - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-outline text-[10px]"
              >
                {fmtVal(rawVal)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.abs((d.value / totalRange) * chartH);
          const x = PAD_X + (i + 0.5) * (chartW / data.length) - barWidth / 2;
          const y = d.value >= 0 ? zeroY - barH : zeroY;
          const isNegative = d.value < 0;

          return (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)}>
              {/* Invisible hover area spanning full height/width slot */}
              <rect
                x={PAD_X + i * (chartW / data.length)}
                y={PAD_TOP}
                width={chartW / data.length}
                height={chartH}
                fill="transparent"
                className="cursor-pointer"
              />

              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={hoveredIdx === i ? "#fff" : chartColor}
                opacity={hoveredIdx === null || hoveredIdx === i ? 1 : 0.5}
                className="transition-all duration-300 ease-out pointer-events-none"
                style={{
                  transformOrigin: isNegative ? "top" : "bottom",
                  transformBox: "fill-box",
                  animation: `growBar 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards ${i * 0.08}s`
                }}
              />

              {/* Tooltip */}
              {hoveredIdx === i && (() => {
                const tooltipY = isNegative ? y + barH + 8 : y - 34;
                const textY = isNegative ? y + barH + 24 : y - 18;
                const cx = x + barWidth / 2;
                return (
                  <g className="pointer-events-none">
                    <rect
                      x={cx - 36}
                      y={tooltipY}
                      width={72}
                      height={24}
                      rx={6}
                      fill="#282a2e"
                      stroke="#494454"
                      strokeWidth="1"
                    />
                    <text
                      x={cx}
                      y={textY}
                      textAnchor="middle"
                      className="text-[11px] font-semibold"
                      style={{ fill: chartColor }}
                    >
                      {fmtVal(d.value)}
                    </text>
                  </g>
                );
              })()}

              {/* X labels */}
              <text
                x={x + barWidth / 2}
                y={PAD_TOP + chartH + 16}
                textAnchor="end"
                transform={`rotate(-40 ${x + barWidth / 2} ${PAD_TOP + chartH + 16})`}
                className="fill-outline text-[9px]"
              >
                {d.label.length > 20 ? d.label.substring(0, 18) + ".." : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function InteractiveGroupedBarChart({ chartDef }: { chartDef: ChartDef }) {
  const [hovered, setHovered] = useState<{group: number, series: number} | null>(null);
  const { data, series = [] } = chartDef;

  const W = 560;
  const H = 280;
  const PAD_X = 40;
  const PAD_TOP = 30;
  const PAD_BOTTOM = 70;
  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  // Flatten all values to find scale
  const allValues = data.flatMap((d: any) => d.values || []).filter((v: number) => !isNaN(v));
  const maxValRaw = allValues.length > 0 ? Math.max(...allValues, 0) : 0;
  const minValRaw = allValues.length > 0 ? Math.min(...allValues, 0) : 0;
  const rangeRaw = maxValRaw - minValRaw || 1;
  
  const maxVal = maxValRaw + rangeRaw * 0.1;
  const minVal = minValRaw;
  const totalRange = maxVal - minVal || 1;

  const groupWidth = chartW / data.length;
  const barSpacing = 2;
  const barWidth = (groupWidth * 0.8) / series.length - barSpacing;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseLeave={() => setHovered(null)}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD_TOP + chartH * (1 - frac);
          const rawVal = minVal + totalRange * frac;
          return (
            <g key={frac}>
              <line x1={PAD_X} y1={y} x2={W - PAD_X} y2={y} stroke="rgba(149,142,160,0.1)" strokeDasharray="4 4" />
              <text x={PAD_X - 8} y={y + 4} textAnchor="end" className="fill-outline text-[10px]">{fmtVal(rawVal)}</text>
            </g>
          );
        })}

        {/* Groups */}
        {data.map((group: any, gIdx: number) => (
          <g key={gIdx}>
            {/* Group Label */}
            <text
              x={PAD_X + (gIdx + 0.5) * groupWidth}
              y={PAD_TOP + chartH + 20}
              textAnchor="middle"
              className="fill-white text-[11px] font-medium"
            >
              {group.label}
            </text>

            {/* Bars in Group */}
            {group.values.map((val: number, sIdx: number) => {
              const h = ((val - minVal) / totalRange) * chartH;
              const x = PAD_X + gIdx * groupWidth + (groupWidth * 0.1) + sIdx * (barWidth + barSpacing);
              const y = PAD_TOP + chartH - h;
              const isHovered = hovered?.group === gIdx && hovered?.series === sIdx;
              const color = series[sIdx]?.color || "#7AA2F7";

              return (
                <g key={sIdx} onMouseEnter={() => setHovered({group: gIdx, series: sIdx})}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={h}
                    fill={isHovered ? "#fff" : color}
                    rx={2}
                    opacity={hovered === null || isHovered ? 1 : 0.4}
                    className="transition-all duration-300"
                  />
                  {isHovered && (
                    <g>
                      <rect x={x + barWidth/2 - 30} y={y - 25} width={60} height={20} rx={4} fill="#1a1b2e" stroke={color} strokeWidth="1" />
                      <text x={x + barWidth/2} y={y - 11} textAnchor="middle" className="text-[10px] font-bold fill-white">{fmtVal(val)}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(${W - PAD_X - 100}, 5)`}>
          {series.map((s: any, i: number) => (
            <g key={i} transform={`translate(0, ${i * 14})`}>
              <rect width={8} height={8} fill={s.color} rx={1} />
              <text x={12} y={7} className="fill-outline text-[9px]">{s.name}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function InteractiveStackedBarChart({ chartDef }: { chartDef: ChartDef }) {
  const [hovered, setHovered] = useState<{group: number, series: number} | null>(null);
  const { data, series = [] } = chartDef;

  const W = 560;
  const H = 280;
  const PAD_X = 40;
  const PAD_TOP = 30;
  const PAD_BOTTOM = 70;
  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  // For stacked bars, we need to find the max sum per group
  const maxValRaw = data.length > 0 
    ? Math.max(...data.map((d: any) => (d.values || []).reduce((a: number, b: number) => a + (isNaN(b) ? 0 : b), 0)))
    : 0;
  
  const maxVal = maxValRaw * 1.1 || 1; // 10% padding on top
  const minVal = 0; // Stacked bars typically start at 0
  const totalRange = maxVal;

  const groupWidth = chartW / data.length;
  const barWidth = groupWidth * 0.6; // Bar takes 60% of group width

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseLeave={() => setHovered(null)}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD_TOP + chartH * (1 - frac);
          const rawVal = minVal + totalRange * frac;
          return (
            <g key={frac}>
              <line x1={PAD_X} y1={y} x2={W - PAD_X} y2={y} stroke="rgba(149,142,160,0.1)" strokeDasharray="4 4" />
              <text x={PAD_X - 8} y={y + 4} textAnchor="end" className="fill-outline text-[10px]">{fmtVal(rawVal)}</text>
            </g>
          );
        })}

        {/* Groups */}
        {data.map((group: any, gIdx: number) => {
          let currentY = PAD_TOP + chartH; // Start from bottom
          const x = PAD_X + gIdx * groupWidth + (groupWidth - barWidth) / 2;

          return (
            <g key={gIdx}>
              {/* Group Label */}
              <text
                x={PAD_X + (gIdx + 0.5) * groupWidth}
                y={PAD_TOP + chartH + 20}
                textAnchor="middle"
                className="fill-white text-[11px] font-medium"
              >
                {group.label}
              </text>

              {/* Stacked Bars in Group */}
              {group.values.map((val: number, sIdx: number) => {
                if (isNaN(val) || val <= 0) return null;
                const h = (val / totalRange) * chartH;
                const y = currentY - h; // The top of this bar segment
                
                const isHovered = hovered?.group === gIdx && hovered?.series === sIdx;
                const color = series[sIdx]?.color || "#7AA2F7";

                const rect = (
                  <g key={sIdx} onMouseEnter={() => setHovered({group: gIdx, series: sIdx})}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={h}
                      fill={isHovered ? "#fff" : color}
                      opacity={hovered === null || isHovered ? 1 : 0.4}
                      className="transition-all duration-300"
                    />
                    {isHovered && (
                      <g>
                        <rect x={x + barWidth/2 - 30} y={y - 25} width={60} height={20} rx={4} fill="#1a1b2e" stroke={color} strokeWidth="1" />
                        <text x={x + barWidth/2} y={y - 11} textAnchor="middle" className="text-[10px] font-bold fill-white">{fmtVal(val)}</text>
                      </g>
                    )}
                  </g>
                );
                currentY = y; // Update current Y for the next segment to stack on top
                return rect;
              })}
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${W - PAD_X - 100}, 5)`}>
          {series.map((s: any, i: number) => (
            <g key={i} transform={`translate(0, ${i * 14})`}>
              <rect width={8} height={8} fill={s.color} rx={1} />
              <text x={12} y={7} className="fill-outline text-[9px]">{s.name}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function InteractiveBoxPlot({ chartDef }: { chartDef: ChartDef }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { data } = chartDef;

  const W = 560;
  const H = 280;
  const PAD_X = 60;
  const PAD_TOP = 20;
  const PAD_BOTTOM = 60;
  const chartW = W - PAD_X - 20;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  // Scale finding
  const allVals = data.flatMap((d: any) => [d.min, d.max, d.q1, d.q3, d.median]).filter((v: number) => !isNaN(v));
  const minValRaw = allVals.length > 0 ? Math.min(...allVals, 0) : 0;
  const maxValRaw = allVals.length > 0 ? Math.max(...allVals, 1) : 1;
  const rangeRaw = maxValRaw - minValRaw || 1;
  
  const minVal = minValRaw - rangeRaw * 0.05;
  const maxVal = maxValRaw + rangeRaw * 0.05;
  const totalRange = maxVal - minVal || 1;

  const itemW = chartW / data.length;
  const boxW = Math.min(30, itemW * 0.6);
  const chartColor = chartDef.color || "#BB9AF7";

  const getY = (v: number) => PAD_TOP + chartH - ((v - minVal) / totalRange) * chartH;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseLeave={() => setHovered(null)}>
        {/* Y Axis Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD_TOP + chartH * (1 - frac);
          const rawVal = minVal + totalRange * frac;
          return (
            <g key={frac}>
              <line x1={PAD_X} y1={y} x2={W - 20} y2={y} stroke="rgba(149,142,160,0.1)" strokeDasharray="4 4" />
              <text x={PAD_X - 8} y={y + 4} textAnchor="end" className="fill-outline text-[10px]">{fmtVal(rawVal)}</text>
            </g>
          );
        })}

        {/* Boxes */}
        {data.map((d: any, i: number) => {
          const cx = PAD_X + (i + 0.5) * itemW;
          const yMin = getY(d.min);
          const yMax = getY(d.max);
          const yQ1 = getY(d.q1);
          const yQ3 = getY(d.q3);
          const yMed = getY(d.median);
          const isHovered = hovered === i;

          return (
            <g key={i} onMouseEnter={() => setHovered(i)}>
              {/* Whisker Line */}
              <line x1={cx} y1={yMin} x2={cx} y2={yMax} stroke={chartColor} strokeWidth="1.5" />
              <line x1={cx - boxW/3} y1={yMin} x2={cx + boxW/3} y2={yMin} stroke={chartColor} strokeWidth="1.5" />
              <line x1={cx - boxW/3} y1={yMax} x2={cx + boxW/3} y2={yMax} stroke={chartColor} strokeWidth="1.5" />

              {/* Box (Q1 to Q3) */}
              <rect
                x={cx - boxW/2}
                y={Math.min(yQ1, yQ3)}
                width={boxW}
                height={Math.abs(yQ1 - yQ3)}
                fill={isHovered ? "#fff" : chartColor}
                opacity={0.8}
                stroke="#1a1b2e"
                strokeWidth="1"
                rx={2}
                className="transition-all duration-300"
              />

              {/* Median Line */}
              <line x1={cx - boxW/2} y1={yMed} x2={cx + boxW/2} y2={yMed} stroke="#1a1b2e" strokeWidth="2" />

              {/* X Label */}
              <text
                x={cx}
                y={PAD_TOP + chartH + 15}
                textAnchor="end"
                transform={`rotate(-35 ${cx} ${PAD_TOP + chartH + 15})`}
                className="fill-outline text-[9px]"
              >
                {d.label.length > 15 ? d.label.substring(0, 13) + ".." : d.label}
              </text>

              {/* Tooltip */}
              {isHovered && (
                <g>
                  <rect x={cx + boxW/2 + 5} y={yMed - 30} width={90} height={60} rx={4} fill="#1a1b2e" stroke={chartColor} strokeWidth="1" />
                  <text x={cx + boxW/2 + 10} y={yMed - 18} className="text-[9px] fill-outline">Max: {fmtVal(d.max)}</text>
                  <text x={cx + boxW/2 + 10} y={yMed - 8} className="text-[9px] fill-white font-bold">Med: {fmtVal(d.median)}</text>
                  <text x={cx + boxW/2 + 10} y={yMed + 2} className="text-[9px] fill-outline">Min: {fmtVal(d.min)}</text>
                  <text x={cx + boxW/2 + 10} y={yMed + 12} className="text-[9px] fill-outline">Q1/Q3: {fmtVal(d.q1)}/{fmtVal(d.q3)}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function InteractivePieChart({ chartDef }: { chartDef: ChartDef }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const data = chartDef.data;
  
  const W = 560;
  const H = 240;
  const centerX = W / 2;
  const centerY = H / 2;
  const radius = 90;
  const hoverRadius = 100;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  // Palette generated based on base color (simplified to 4 distinct shades)
  const colors = [
    chartDef.color,
    "#d0bcff",
    "#958ea0",
    "#ffea7f",
    "#ffb4ab"
  ];

  let currentAngle = -Math.PI / 2; // start at top

  return (
    <div className="flex items-center justify-center h-full relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {data.map((d, i) => {
          const sliceAngle = (d.value / total) * Math.PI * 2;
          const startAngle = currentAngle;
          const endAngle = startAngle + sliceAngle;
          currentAngle = endAngle;

          const r = hoveredIdx === i ? hoverRadius : radius;
          
          const x1 = centerX + r * Math.cos(startAngle);
          const y1 = centerY + r * Math.sin(startAngle);
          const x2 = centerX + r * Math.cos(endAngle);
          const y2 = centerY + r * Math.sin(endAngle);
          
          const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
          
          // Donut inner radius
          const innerR = 45;
          const ix1 = centerX + innerR * Math.cos(endAngle);
          const iy1 = centerY + innerR * Math.sin(endAngle);
          const ix2 = centerX + innerR * Math.cos(startAngle);
          const iy2 = centerY + innerR * Math.sin(startAngle);

          const pathData = [
            `M ${x1} ${y1}`,
            `A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L ${ix1} ${iy1}`,
            `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
            "Z"
          ].join(" ");

          // Midpoint for text
          const midAngle = startAngle + sliceAngle / 2;
          const textR = radius + 30;
          const textX = centerX + textR * Math.cos(midAngle);
          const textY = centerY + textR * Math.sin(midAngle);
          const percent = ((d.value / total) * 100).toFixed(1);

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              style={{
                transformOrigin: `${centerX}px ${centerY}px`,
                opacity: 0,
                animation: `popIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards ${i * 0.15}s`
              }}
            >
              <path
                d={pathData}
                fill={colors[i % colors.length]}
                stroke="#15171B"
                strokeWidth={2}
                className="transition-all duration-300 ease-out cursor-pointer"
                opacity={hoveredIdx === null || hoveredIdx === i ? 1 : 0.5}
              />
              
              {/* Only show label if slice is somewhat large or if hovered */}
              {(sliceAngle > 0.4 || hoveredIdx === i) && (
                <text
                  x={textX}
                  y={textY}
                  textAnchor={Math.cos(midAngle) > 0 ? "start" : "end"}
                  alignmentBaseline="middle"
                  className="text-[11px] font-medium transition-all duration-300 pointer-events-none"
                  style={{ fill: hoveredIdx === i ? "#fff" : colors[i % colors.length] }}
                >
                  {d.label} ({percent}%)
                </text>
              )}
            </g>
          );
        })}
        
        {/* Center text */}
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          alignmentBaseline="middle"
          className="fill-on-surface text-xl font-bold pointer-events-none"
        >
          {hoveredIdx !== null ? fmtVal(data[hoveredIdx].value) : fmtVal(total)}
        </text>
        <text
          x={centerX}
          y={centerY + 16}
          textAnchor="middle"
          alignmentBaseline="middle"
          className="fill-outline text-[9px] uppercase tracking-widest pointer-events-none"
        >
          {hoveredIdx !== null ? data[hoveredIdx].label : "Total"}
        </text>
      </svg>
    </div>
  );
}

function InteractiveChart({ chartDef }: { chartDef: ChartDef }) {
  if (chartDef.type === "bar") return <InteractiveBarChart chartDef={chartDef} />;
  if (chartDef.type === "grouped_bar") return <InteractiveGroupedBarChart chartDef={chartDef} />;
  if (chartDef.type === "stacked_bar") return <InteractiveStackedBarChart chartDef={chartDef} />;
  if (chartDef.type === "box_plot") return <InteractiveBoxPlot chartDef={chartDef} />;
  if (chartDef.type === "pie") return <InteractivePieChart chartDef={chartDef} />;
  if (chartDef.type === "heatmap") return <InteractiveHeatmap chartDef={chartDef} />;
  if (chartDef.type === "scatter") return <InteractiveScatterChart chartDef={chartDef} />;
  return <InteractiveLineChart chartDef={chartDef} />;
}

function InteractiveScatterChart({ chartDef }: { chartDef: ChartDef }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const { data, series = [], xAxisLabel = "X", yAxisLabel = "Y" } = chartDef;

  const W = 560;
  const H = 240;
  const PAD_X = 60;
  const PAD_TOP = 20;
  const PAD_BOT = 40;

  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_TOP - PAD_BOT;

  // Find min/max for scaling
  const xs = data.map((d: any) => d.x);
  const ys = data.map((d: any) => d.y);
  
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 1);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 1);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const getX = (x: number) => PAD_X + ((x - minX) / rangeX) * chartW;
  const getY = (y: number) => PAD_TOP + chartH - ((y - minY) / rangeY) * chartH;

  const defaultColor = chartDef.color || "#7AA2F7";

  return (
    <div className="flex items-center justify-center h-full relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Y Axis Grid & Labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const val = minY + rangeY * p;
          const y = getY(val);
          return (
            <g key={`y-${i}`}>
              <line
                x1={PAD_X}
                y1={y}
                x2={W - PAD_X}
                y2={y}
                stroke="#1F2228"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={PAD_X - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-outline text-[10px]"
              >
                {fmtVal(val)}
              </text>
            </g>
          );
        })}

        {/* X Axis Grid & Labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const val = minX + rangeX * p;
          const x = getX(val);
          return (
            <g key={`x-${i}`}>
              <line
                x1={x}
                y1={PAD_TOP}
                x2={x}
                y2={PAD_TOP + chartH}
                stroke="#1F2228"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={x}
                y={PAD_TOP + chartH + 16}
                textAnchor="middle"
                className="fill-outline text-[10px]"
              >
                {fmtVal(val)}
              </text>
            </g>
          );
        })}

        {/* Axis Titles */}
        <text
          x={PAD_X / 2 - 10}
          y={PAD_TOP + chartH / 2}
          transform={`rotate(-90 ${PAD_X / 2 - 10} ${PAD_TOP + chartH / 2})`}
          textAnchor="middle"
          className="fill-outline text-[9px] font-semibold uppercase tracking-widest"
        >
          {yAxisLabel}
        </text>
        <text
          x={PAD_X + chartW / 2}
          y={H - 5}
          textAnchor="middle"
          className="fill-outline text-[9px] font-semibold uppercase tracking-widest"
        >
          {xAxisLabel}
        </text>

        {/* Scatter Points */}
        {data.map((d: any, i: number) => {
          const color = series[d.seriesIndex]?.color || defaultColor;
          const cx = getX(d.x);
          const cy = getY(d.y);
          const isHovered = hoveredIdx === i;

          return (
            <g key={`pt-${i}`} onMouseEnter={() => setHoveredIdx(i)}>
              {/* Invisible larger circle for easier hovering */}
              <circle cx={cx} cy={cy} r={12} fill="transparent" className="cursor-pointer" />
              
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                fill={color}
                opacity={hoveredIdx === null || isHovered ? 1 : 0.4}
                className="transition-all duration-300 ease-out pointer-events-none"
                style={{
                  transformOrigin: `${cx}px ${cy}px`,
                  animation: `popIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards ${i * 0.02}s`,
                  opacity: 0
                }}
              />

              {/* Tooltip */}
              {isHovered && (
                <g className="pointer-events-none">
                  <rect
                    x={cx - 36}
                    y={cy - 34}
                    width={72}
                    height={24}
                    rx={6}
                    fill="#282a2e"
                    stroke="#494454"
                  />
                  <text
                    x={cx}
                    y={cy - 18}
                    textAnchor="middle"
                    className="text-[10px] font-semibold fill-white"
                  >
                    ({fmtVal(d.x)}, {fmtVal(d.y)})
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function InteractiveHeatmap({ chartDef }: { chartDef: ChartDef }) {
  const [hovered, setHovered] = useState<{r: number, c: number} | null>(null);
  const { data, xLabels = [], yLabels = [], colorScale = ["#15171B", "#d0bcff", "#ff5252"] } = chartDef;
  
  const W = 560;
  const H = 380;
  const PAD_LEFT = 100;
  const PAD_RIGHT = 20;
  const PAD_TOP = 20;
  const PAD_BOTTOM = 120;
  
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;
  
  const rows = data.length;
  const cols = data[0]?.length || 1;
  const cellW = chartW / cols;
  const cellH = chartH / rows;

  // Flatten all values for min-max normalization
  const flatData = data.flat().map((v: number) => Math.abs(v));
  const minVal = Math.min(...flatData);
  const maxVal = Math.max(...flatData);
  const range = maxVal - minVal || 1;

  // Helper: parse hex to RGB
  const hexToRgb = (hex: string) => {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  };

  // 3-stop color gradient: low → mid → high
  const lowColor  = hexToRgb(colorScale[0] || "#1a1b2e");  // dark navy
  const midColor  = hexToRgb(colorScale[1] || "#7AA2F7");  // blue
  const highColor = hexToRgb(colorScale[2] || "#F7768E");  // hot pink/red

  // Interpolate between two RGB colors
  const lerpColor = (a: typeof lowColor, b: typeof lowColor, t: number) => {
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    return `rgb(${r},${g},${bl})`;
  };

  // Map value → fully interpolated color (no opacity tricks)
  const getCellColor = (val: number) => {
    const normalized = (Math.abs(val) - minVal) / range; // 0..1
    if (normalized < 0.5) {
      return lerpColor(lowColor, midColor, normalized * 2);
    }
    return lerpColor(midColor, highColor, (normalized - 0.5) * 2);
  };

  return (
    <div className="flex items-center justify-center h-full relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseLeave={() => setHovered(null)}>
        {/* Y Labels */}
        {yLabels.map((lbl, i) => (
          <text
            key={`y-${i}`}
            x={PAD_LEFT - 10}
            y={PAD_TOP + (i + 0.5) * cellH}
            textAnchor="end"
            alignmentBaseline="middle"
            className="fill-outline text-[9px]"
          >
            {lbl.length > 15 ? lbl.substring(0, 13) + ".." : lbl}
          </text>
        ))}

        {/* X Labels */}
        {xLabels.map((lbl, j) => (
          <text
            key={`x-${j}`}
            x={PAD_LEFT + (j + 0.5) * cellW}
            y={PAD_TOP + chartH + 15}
            textAnchor="end"
            transform={`rotate(-40 ${PAD_LEFT + (j + 0.5) * cellW} ${PAD_TOP + chartH + 15})`}
            className="fill-outline text-[9px]"
          >
            {lbl.length > 15 ? lbl.substring(0, 13) + ".." : lbl}
          </text>
        ))}

        {/* Cells */}
        {data.map((row, i) => 
          row.map((val: number, j: number) => {
            const isHovered = hovered?.r === i && hovered?.c === j;
            return (
              <g key={`cell-${i}-${j}`} onMouseEnter={() => setHovered({r: i, c: j})}>
                <rect
                  x={PAD_LEFT + j * cellW}
                  y={PAD_TOP + i * cellH}
                  width={cellW - 2}
                  height={cellH - 2}
                  rx={2}
                  fill={getCellColor(val)}
                  opacity={isHovered ? 1 : 0.85}
                  stroke={isHovered ? "#fff" : "transparent"}
                  strokeWidth={isHovered ? 2 : 0}
                  className="transition-all duration-300 cursor-pointer"
                  style={{ animation: `fadeIn 0.5s ease forwards ${(i+j)*0.05}s` }}
                />
                
                {/* Tooltip */}
                {isHovered && (
                  <g className="pointer-events-none">
                    <rect
                      x={PAD_LEFT + j * cellW + cellW/2 - 30}
                      y={PAD_TOP + i * cellH - 25}
                      width={60}
                      height={20}
                      rx={4}
                      fill="#282a2e"
                      stroke="#494454"
                    />
                    <text
                      x={PAD_LEFT + j * cellW + cellW/2}
                      y={PAD_TOP + i * cellH - 11}
                      textAnchor="middle"
                      className="text-[10px] font-semibold fill-white"
                    >
                      {fmtVal(val)}
                    </text>
                  </g>
                )}
              </g>
            );
          })
        )}
        {/* Color Legend */}
        {(() => {
          const legendX = PAD_LEFT;
          const legendY = PAD_TOP + chartH + 45;
          const legendW = chartW;
          const legendH = 10;
          const stops = 20;
          const stepW = legendW / stops;

          return (
            <g>
              {/* Gradient bar made of small rects */}
              {Array.from({ length: stops }).map((_, s) => {
                const t = s / (stops - 1);
                const val = minVal + t * range;
                return (
                  <rect
                    key={`legend-${s}`}
                    x={legendX + s * stepW}
                    y={legendY}
                    width={stepW + 0.5}
                    height={legendH}
                    rx={s === 0 ? 3 : s === stops - 1 ? 3 : 0}
                    fill={getCellColor(val)}
                  />
                );
              })}

              {/* Border around legend */}
              <rect
                x={legendX}
                y={legendY}
                width={legendW}
                height={legendH}
                rx={3}
                fill="none"
                stroke="#1F2228"
                strokeWidth={1}
              />

              {/* Min label */}
              <text
                x={legendX}
                y={legendY + legendH + 12}
                textAnchor="start"
                className="fill-outline text-[9px]"
              >
                {fmtVal(minVal)} (Low)
              </text>

              {/* Mid label */}
              <text
                x={legendX + legendW / 2}
                y={legendY + legendH + 12}
                textAnchor="middle"
                className="fill-outline text-[9px]"
              >
                {fmtVal(minVal + range / 2)}
              </text>

              {/* Max label */}
              <text
                x={legendX + legendW}
                y={legendY + legendH + 12}
                textAnchor="end"
                className="fill-outline text-[9px]"
              >
                {fmtVal(maxVal)} (High)
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Severity Icon                                                      */
/* ------------------------------------------------------------------ */

function SeverityIcon({ severity }: { severity: "success" | "warning" | "error" }) {
  if (severity === "success")
    return <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />;
  if (severity === "warning")
    return <AlertTriangle className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />;
  return <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />;
}

/* ------------------------------------------------------------------ */
/*  Syntax highlighting & output helpers                               */
/* ------------------------------------------------------------------ */

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const PY_KEYWORDS = new Set([
  'def','import','from','return','for','if','in','class','as','with',
  'try','except','raise','while','elif','else','not','and','or','is',
  'None','True','False','print','lambda','assert','pass','break',
  'continue','yield','async','await','del','global','nonlocal'
]);

function highlightPython(line: string): string {
  // Tokenize the raw line into segments: strings, comments, keywords, numbers, and plain text
  const segments: { text: string; color?: string }[] = [];
  let i = 0;

  while (i < line.length) {
    // Comments: # to end of line
    if (line[i] === '#') {
      segments.push({ text: line.slice(i), color: '#565F89' });
      break;
    }

    // Strings: single or double quoted
    if (line[i] === "'" || line[i] === '"') {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === '\\') j++; // skip escaped chars
        j++;
      }
      segments.push({ text: line.slice(i, j + 1), color: '#9ECE6A' });
      i = j + 1;
      continue;
    }

    // Word boundaries: keywords or identifiers
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (PY_KEYWORDS.has(word)) {
        segments.push({ text: word, color: '#BB9AF7' });
      } else {
        segments.push({ text: word });
      }
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[0-9.]/.test(line[j])) j++;
      segments.push({ text: line.slice(i, j), color: '#FF9E64' });
      i = j;
      continue;
    }

    // Everything else (operators, whitespace, punctuation)
    segments.push({ text: line[i] });
    i++;
  }

  return segments
    .map(s => s.color
      ? `<span style="color:${s.color}">${escapeHtml(s.text)}</span>`
      : escapeHtml(s.text)
    )
    .join('');
}

function parseOutput(raw: string): string {
  if (!raw) return '';
  // MCP tool results come as [{type: 'text', text: '...'}]
  try {
    const parsed = JSON.parse(raw.replace(/'/g, '"'));
    if (Array.isArray(parsed) && parsed[0]?.text) {
      return parsed[0].text;
    }
  } catch {
    // Not JSON — return as-is
  }
  // Strip leading [{'type': 'text', 'text': ' wrapper if present
  const match = raw.match(/\[\{['"]type['"]:\s*['"]text['"],\s*['"]text['"]:\s*['"]([\s\S]*?)['"]\}\]/)
  if (match) return match[1].replace(/\\n/g, '\n');
  return raw;
}

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */

const iconMap = {
  database: <Database className="w-5 h-5 text-secondary" />,
  brain: <Brain className="w-5 h-5 text-primary" />,
  code: <Code className="w-5 h-5 text-tertiary" />,
};

/* ------------------------------------------------------------------ */
/*  Chart Section with Tabs                                            */
/* ------------------------------------------------------------------ */

function ChartSection({ charts }: { charts: ChartDef[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clamp activeIdx if charts array shrinks
  const safeIdx = Math.min(activeIdx, charts.length - 1);
  const activeChart = charts.length > 0 ? charts[safeIdx] : null;

  if (!activeChart) {
    return (
      <div className="bg-surface-container rounded-xl border border-[#1F2228] p-5 flex flex-col h-[300px] items-center justify-center">
        <p className="text-on-surface-variant text-sm">No chart data available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container rounded-xl border border-[#1F2228] p-5 flex flex-col h-full">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Analytics
        </h4>
        
        {/* Custom Dropdown Selector */}
        {charts.length > 1 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between gap-3 bg-[#111317] border border-[#1F2228] text-on-surface-variant text-[11px] font-medium rounded-full px-4 py-1.5 hover:border-[#333539] hover:text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer min-w-[160px]"
            >
              <span className="truncate">{activeChart.title || activeChart.label || `Chart ${activeIdx + 1}`}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-outline ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-full min-w-[180px] bg-[#15171B] border border-[#282a2e] rounded-xl shadow-2xl overflow-hidden z-50 py-1 flex flex-col backdrop-blur-xl">
                {charts.map((chart, idx) => (
                  <button
                    key={chart.id || `chart-${idx}`}
                    onClick={() => {
                      setActiveIdx(idx);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[11px] font-medium transition-colors cursor-pointer ${
                      activeIdx === idx
                        ? "bg-[#1e2024] text-primary"
                        : "text-on-surface-variant hover:bg-[#1a1c20] hover:text-on-surface"
                    }`}
                  >
                    {chart.title || chart.label || `Chart ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Render */}
      <div className="flex-1 min-h-[240px]">
        {/* We use key to force re-render when switching so animations play nicely */}
        <InteractiveChart key={activeChart.id} chartDef={activeChart} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal Component                                                    */
/* ------------------------------------------------------------------ */

export default function NodeDetailModal({ nodeId, onClose, forceTestMode }: NodeDetailModalProps) {
  const { viewMode, tourTab } = useViewMode();
  const isTestMode = forceTestMode || viewMode === "test-developer";
  const detail = nodeDetails[nodeId];
  const [activeTab, setActiveTab] = useState<"chart" | "review" | "code">(nodeId === "report-writer" ? "review" : "chart");
  const [copied, setCopied] = useState(false);
  const [copiedCellIdx, setCopiedCellIdx] = useState<number | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Tour can control active tab
  useEffect(() => {
    if (tourTab) {
      setActiveTab(tourTab);
    }
  }, [tourTab]);

  const agentMap: Record<string, number> = {
    "data-inspector": 1,
    "fairness-adjudicator": 2,
    "mitigation-expert": 3,
    "report-writer": 4
  };
  const agentNum = agentMap[nodeId];

  const [dynamicCharts, setDynamicCharts] = useState<ChartDef[] | null>(null);
  const [dynamicMetrics, setDynamicMetrics] = useState<{ metrics: any[], findings: any[] } | null>(null);
  const [dynamicReview, setDynamicReview] = useState<string | null>(null);
  const [dynamicCode, setDynamicCode] = useState<{code: string, output: string | null}[] | null>(null);
  const [isLoadingCharts, setIsLoadingCharts] = useState(!!agentNum);

  useEffect(() => {
    if (!agentNum || isTestMode) {
      setIsLoadingCharts(false);
      if (isTestMode && detail?.codeSnippet) {
        setDynamicCode([{ code: detail.codeSnippet, output: "Mock execution output..." }]);
      }
      return;
    }
    
    setIsLoadingCharts(true);
    let intervalId: NodeJS.Timeout;

    const fetchCharts = async () => {
      let chartsOk = false;
      let metricsOk = false;
      let reviewOk = false;
      const ts = Date.now(); // cache buster

      if (agentNum !== 4) {
        try {
          const resCharts = await fetch(`${API_BASE_URL}/outputs/agent${agentNum}_charts.json?t=${ts}`);
          if (resCharts.ok) {
            const chartsData = await resCharts.json();
            setDynamicCharts(chartsData);
            chartsOk = true;
          }
        } catch {
          // file may not exist yet
        }
      }

      try {
        const resMetrics = await fetch(`${API_BASE_URL}/outputs/agent${agentNum}_metrics.json?t=${ts}`);
        if (resMetrics.ok) {
          const metricsData = await resMetrics.json();
          setDynamicMetrics(metricsData);
          metricsOk = true;
        }
      } catch {
        // file may not exist yet
      }

      try {
        const resReview = await fetch(`${API_BASE_URL}/outputs/agent${agentNum}.md?t=${ts}`);
        if (resReview.ok) {
          const reviewText = await resReview.text();
          setDynamicReview(reviewText);
          reviewOk = true;
        }
      } catch {
        // file may not exist yet
      }

      try {
        const resCode = await fetch(`${API_BASE_URL}/outputs/agent${agentNum}_code.json?t=${ts}`);
        if (resCode.ok) {
          const codeData = await resCode.json();
          setDynamicCode(codeData);
        }
      } catch {
        // Silently ignore — file may not exist yet
      }

      if (chartsOk) {
        setIsLoadingCharts(false);
      }
      
      // Agent 4 does not produce a charts JSON file, so we shouldn't wait for it.
      const isComplete = agentNum === 4 
        ? (metricsOk && reviewOk) 
        : (chartsOk && metricsOk && reviewOk);

      if (isComplete) {
        clearInterval(intervalId);
      }
    };

    fetchCharts(); // initial try
    intervalId = setInterval(fetchCharts, 2000); // poll every 2s

    return () => clearInterval(intervalId);
  }, [agentNum, isTestMode]);

  // In test-developer mode, use the static hardcoded data; in live mode, use dynamic API data
  const chartsToRender = isTestMode ? (detail?.charts || []) : (dynamicCharts || []);
  const metricsToRender = isTestMode ? (detail?.metrics || []) : (dynamicMetrics?.metrics || []);
  const findingsToRender = isTestMode ? (detail?.findings || []) : (dynamicMetrics?.findings || []);
  const reviewToRender = isTestMode ? (detail?.review || "") : (dynamicReview || "");

  const allCode = isTestMode
    ? (detail?.codeSnippet || "")
    : (dynamicCode?.map((c, i) => `# Cell [${i + 1}]\n${c.code}`).join("\n\n") || "");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(allCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [allCode]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose]
  );

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!detail) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
    >
      <div className="w-full max-w-[1100px] max-h-[calc(100vh-64px)] bg-[#15171B] border border-[#1F2228] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-[slideUp_250ms_ease-out]">
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2228] bg-[#111317]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-container/10 border border-[#1F2228] flex items-center justify-center">
              {iconMap[detail.iconType]}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">{detail.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: detail.statusColor }}
                />
                <span className="text-xs" style={{ color: detail.statusColor }}>
                  {detail.statusLabel}
                </span>
                <span className="text-xs text-outline">·</span>
                <span className="text-xs text-outline flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last run {detail.lastRun}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-outline hover:text-on-surface hover:bg-[#1F2228] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ---- Tabs ---- */}
        <div className="flex gap-1 px-6 pt-4 pb-0 items-center justify-between">
          <div className="flex gap-1">
            {nodeId !== "report-writer" && (
              <button
                onClick={() => setActiveTab("chart")}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                  activeTab === "chart"
                    ? "bg-surface-container text-primary border border-b-0 border-[#1F2228]"
                    : "text-outline hover:text-on-surface-variant"
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </span>
              </button>
            )}
            <button
              onClick={() => setActiveTab("review")}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                activeTab === "review"
                  ? "bg-surface-container text-primary border border-b-0 border-[#1F2228]"
                  : "text-outline hover:text-on-surface-variant"
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Review
              </span>
            </button>
            {nodeId !== "report-writer" && (
              <button
                onClick={() => setActiveTab("code")}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                  activeTab === "code"
                    ? "bg-surface-container text-primary border border-b-0 border-[#1F2228]"
                    : "text-outline hover:text-on-surface-variant"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Code
                </span>
              </button>
            )}
          </div>

          {/* Download buttons — only for Report Writer */}
          {nodeId === "report-writer" && (
            <div className="flex items-center gap-3">
              <a
                href={`${API_BASE_URL}/outputs/fixed_dataset.csv`}
                download="Aletheia_Fixed_Dataset.csv"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-[#7AA2F7] text-[#7AA2F7] hover:bg-[#7AA2F7]/10 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Fixed Data
              </a>
              <a
                href={`${API_BASE_URL}/outputs/final_report.pdf`}
                download="Aletheia_Fairness_Report.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-[#7AA2F7] to-[#BB9AF7] text-[#1a1b26] hover:shadow-[0_0_20px_rgba(122,162,247,0.4)] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                PDF Report
              </a>
            </div>
          )}
        </div>

        {/* ---- Content ---- */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {activeTab === "chart" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Chart — 3 cols */}
              <div className="lg:col-span-3">
                {isLoadingCharts ? (
                  <div className="bg-surface-container rounded-xl border border-[#1F2228] p-5 flex flex-col h-[300px] items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-on-surface font-medium">Making charts...</p>
                    <p className="text-xs text-outline mt-1">Waiting for agent to generate data</p>
                  </div>
                ) : (
                  <ChartSection charts={chartsToRender} />
                )}
              </div>

              {/* Metrics — 2 cols */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Metric cards */}
                <div className="grid grid-cols-2 gap-3">
                  {metricsToRender.map((m) => (
                    <div
                      key={m.label}
                      className="bg-surface-container rounded-xl border border-[#1F2228] p-4 flex flex-col gap-1 hover:border-primary-container/40 transition-colors overflow-hidden"
                    >
                      <span className="text-[11px] text-outline uppercase tracking-wider truncate" title={m.label}>
                        {m.label}
                      </span>
                      <span
                        className={`font-bold text-on-surface truncate ${
                          String(m.value).length > 12 ? 'text-sm' : String(m.value).length > 8 ? 'text-base' : 'text-xl'
                        }`}
                        title={String(m.value)}
                      >
                        {m.value}
                      </span>
                      {m.change && (
                        <span
                          className={`text-xs font-medium flex items-center gap-1 ${
                            m.up ? "text-secondary" : "text-tertiary"
                          }`}
                        >
                          <TrendingUp
                            className={`w-3 h-3 ${!m.up ? "rotate-180" : ""}`}
                          />
                          {m.change}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "review" && (
            /* Review tab */
            <div className="max-w-3xl mx-auto">
              <div className="bg-surface-container rounded-xl border border-[#1F2228] p-6">
                <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Execution Review
                </h4>
                <div className="custom-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                    {reviewToRender}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Metrics summary in review tab */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
                {metricsToRender.map((m) => (
                  <div
                    key={m.label}
                    className="bg-surface-container rounded-xl border border-[#1F2228] p-4 text-center overflow-hidden"
                  >
                    <span className="text-[10px] text-outline uppercase tracking-wider block truncate" title={m.label}>
                      {m.label}
                    </span>
                    <span
                      className={`font-bold text-on-surface mt-1 block truncate ${
                        String(m.value).length > 12 ? 'text-sm' : String(m.value).length > 8 ? 'text-base' : 'text-lg'
                      }`}
                      title={String(m.value)}
                    >
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "code" && (
            <div className="max-w-4xl mx-auto flex flex-col gap-0">
              {/* Notebook Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-tertiary" />
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Execution Notebook</span>
                  <span className="ml-1 text-[10px] uppercase tracking-wider font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20">
                    {dynamicCode ? `${dynamicCode.length} cells` : "Loading..."}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-outline hover:text-on-surface hover:bg-[#1F2228] transition-all cursor-pointer border border-[#1F2228]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-secondary" />
                      <span className="text-secondary">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>
              </div>

              {/* Notebook Cells */}
              {!dynamicCode || dynamicCode.length === 0 ? (
                <div className="bg-surface-container rounded-xl border border-[#1F2228] p-8 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-on-surface font-medium">Waiting for code cells...</p>
                  <p className="text-xs text-outline mt-1">Code will appear as the agent executes</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {dynamicCode.map((cell, idx) => (
                    <div key={idx} className="bg-[#111317] rounded-xl border border-[#1F2228] overflow-hidden">
                      {/* Cell Header */}
                      <div className="flex items-center justify-between px-4 py-2 bg-[#1A1D21] border-b border-[#1F2228]">
                        <div className="flex items-center gap-2">
                          <Play className="w-3 h-3 text-secondary" />
                          <span className="text-[10px] font-mono text-outline">In [{idx + 1}]</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(cell.code);
                            setCopiedCellIdx(idx);
                            setTimeout(() => setCopiedCellIdx(null), 1500);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-outline hover:text-on-surface hover:bg-[#282A2E] transition-all cursor-pointer"
                        >
                          {copiedCellIdx === idx ? (
                            <>
                              <Check className="w-3 h-3 text-secondary" />
                              <span className="text-secondary">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      {/* Code */}
                      <div className="p-4 overflow-x-auto border-b border-[#1F2228]">
                        <pre className="text-[12px] font-mono leading-relaxed">
                          <code style={{color:'#A9B1D6'}}>
                            {cell.code.split('\n').map((line, i) => (
                              <div key={i} className="table-row">
                                <span className="table-cell text-right pr-4 select-none text-[11px] w-8" style={{color:'#363B54'}}>{i + 1}</span>
                                <span className="table-cell whitespace-pre" dangerouslySetInnerHTML={{ __html: highlightPython(line) }} />
                              </div>
                            ))}
                          </code>
                        </pre>
                      </div>
                      {/* Output */}
                      {cell.output && (
                        <div className="px-4 py-3 bg-[#0D1117]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Hash className="w-3 h-3 text-outline" />
                            <span className="text-[10px] font-mono text-outline">Out [{idx + 1}]</span>
                          </div>
                          <pre className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto" style={{color:'#7AA2F7'}}>
                            {parseOutput(cell.output)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
