"use client";

import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";

import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Edge,
  type ColorMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import AgentNode, { type AgentNodeType } from "./AgentNode";
import AttributeNode, { type AttributeNodeType } from "./AttributeNode";
import UploadNode, { type UploadNodeType } from "./UploadNode";
import DockerNode, { type DockerNodeType, type DockerStatus } from "./DockerNode";
import NodeDetailModal from "./NodeDetailModal";
import CanvasControls from "./CanvasControls";
import AskSidebar from "./AskSidebar";

import { useViewMode } from "./ViewModeContext";
import { WS_BASE_URL } from "../lib/config";

/* ------------------------------------------------------------------ */
/*  Initial data                                                       */
/* ------------------------------------------------------------------ */

const initialNodes: (AgentNodeType | AttributeNodeType | UploadNodeType | DockerNodeType)[] = [
  {
    id: "dataset-upload",
    type: "upload",
    position: { x: 100, y: 155 },
    data: {
      title: "Dataset Input",
    },
  } as UploadNodeType,
  {
    id: "docker-sandbox",
    type: "docker",
    position: { x: 520, y: 220 },
    data: {
      status: "idle" as DockerStatus,
    },
  } as DockerNodeType,
  {
    id: "data-inspector",
    type: "agent",
    position: { x: 800, y: 170 },
    data: {
      title: "Dataset Auditor",
      iconType: "database",
      description:
        "Analyzes the source dataset for feature imbalances and demographic disparities.",
      inputLabel: "Raw Dataset",
      outputLabel: "Analyzed Data",
      inputVariant: "default",
      outputVariant: "active",
      toolCalls: [],
      hasRunButton: true
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e-upload-docker",
    source: "dataset-upload",
    target: "docker-sandbox",
    type: "default",
    animated: false,
    style: { stroke: "#958ea0", strokeWidth: 2, strokeDasharray: "6 4" },
  },
  {
    id: "e-docker-di",
    source: "docker-sandbox",
    target: "data-inspector",
    type: "default",
    animated: false,
    style: { stroke: "#958ea0", strokeWidth: 2, strokeDasharray: "6 4" },
  },
];

// Reference data for sequential discovery
const agentDefinitions: Record<string, AgentNodeType> = {
  "fairness-adjudicator": {
    id: "fairness-adjudicator",
    type: "agent",
    position: { x: 800, y: 170 },
    data: {
      title: "Agent Auditor",
      iconType: "brain",
      inputLabel: "Clean Struct",
      outputLabel: "Filtered Data",
      inputVariant: "active",
      outputVariant: "active",
      isSelected: true,
      hasRunButton: true,
      toolCalls: [
        {
          id: "t3",
          name: "audit_fairness_metrics",
          inputs: '{\n  "dataset_id": "v3.0",\n  "strictness": "high"\n}',
          output: '{\n  "status": "pending",\n  "message": "Awaiting execution"\n}'
        }
      ]
    },
  } as AgentNodeType,
  "mitigation-expert": {
    id: "mitigation-expert",
    type: "agent",
    position: { x: 1200, y: 170 },
    data: {
      title: "Mitigation Expert",
      iconType: "code",
      description: "Applies bias mitigation algorithms (Reweighing, Adv. Debiasing) to rectify disparities.",
      inputLabel: "Biased Data",
      outputLabel: "Mitigated Data",
      inputVariant: "default",
      outputVariant: "active",
      hasRunButton: true,
      toolCalls: [
        {
          id: "t4",
          name: "apply_reweighing",
          inputs: '{\n  "target": "approved",\n  "protected": "gender"\n}',
          output: '{\n  "status": "success",\n  "weights_applied": 1250\n}'
        }
      ]
    },
  } as AgentNodeType,
  "report-writer": {
    id: "report-writer",
    type: "agent",
    position: { x: 1600, y: 170 },
    data: {
      title: "Report Writer",
      iconType: "code",
      description: "Compiles all audit outputs into a polished PDF report with charts and findings.",
      inputLabel: "All Reports",
      outputLabel: "Final PDF",
      inputVariant: "default",
      outputVariant: "active",
      hasRunButton: true,
    },
  } as AgentNodeType,
};

const defaultEdgeOptions = {
  style: {
    stroke: "#d0bcff",
    strokeWidth: 2,
    filter: "drop-shadow(0 0 4px rgba(208, 188, 255, 0.6))",
  },
  animated: false,
};

export default function FlowCanvas() {
  const { isSidebarCollapsed, viewMode } = useViewMode();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [discoveredAttributes, setDiscoveredAttributes] = useState<string[]>([]);
  const [testFileName, setTestFileName] = useState("data.csv");
  const [testTargetColumn, setTestTargetColumn] = useState("approved");

  const nodeTypes = useMemo(() => ({ 
    agent: AgentNode, 
    attribute: AttributeNode, 
    upload: UploadNode, 
    docker: DockerNode 
  }), []);

  const setDockerStatus = useCallback((status: DockerStatus, containerId?: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "docker-sandbox"
          ? { ...n, data: { ...n.data, status, containerId: containerId || (n.data as any).containerId } } as DockerNodeType
          : n
      )
    );
  }, [setNodes]);

  const handleRunStartRef = useRef<(nodeId: string) => void>(() => {});

  const handleUploadComplete = useCallback((fileName: string, targetCol?: string) => {
    if (fileName) setTestFileName(fileName);
    if (targetCol) setTestTargetColumn(targetCol);
    setNodes(initialNodes);
    setDiscoveredAttributes([]);

    setEdges(initialEdges.map((e) => {
      if (e.id === "e-upload-docker") {
        return { ...e, animated: true, style: { stroke: "#4edea3", strokeWidth: 2 } };
      }
      return e;
    }));

    setTimeout(() => {
      handleRunStartRef.current("data-inspector");
    }, 300);
  }, [setNodes, setEdges]);



  // Horizontal gap between agent nodes (must account for agent card width ~280px + attribute column)
  const AGENT_GAP_X = 600;
  // Smaller gap for direct agent-to-agent (no attributes between)
  const AGENT_DIRECT_GAP_X = 400;
  // Vertical spacing between attribute nodes
  const ATTR_SPACING_Y = 70;
  // Agent card approximate width
  const AGENT_CARD_W = 300;

  const handleRunComplete = useCallback(
    (nodeId: string, dynamicAttrs?: string[]) => {
      if (nodeId === "data-inspector") {
        const attributesToUse = (dynamicAttrs && dynamicAttrs.length > 0)
          ? dynamicAttrs 
          : discoveredAttributes;

        setNodes((nds) => {
          const updatedNodes = nds.map((n) =>
            n.id === nodeId ? ({ ...n, data: { ...n.data, hasRunButton: false } } as typeof n) : n
          );
          // Find the source node's current position
          const sourceNode = updatedNodes.find(n => n.id === "data-inspector");
          const sourceX = sourceNode?.position?.x ?? 800;
          const sourceY = sourceNode?.position?.y ?? 170;

          // Center attributes horizontally between source right edge and next agent left edge
          const attrX = sourceX + AGENT_CARD_W + (AGENT_GAP_X - AGENT_CARD_W) / 2 - 40;
          const totalAttrHeight = (attributesToUse.length - 1) * ATTR_SPACING_Y;
          // Center vertically around the agent's vertical center (~150px half-height)
          const agentCenterY = sourceY + 130;
          const attrStartY = agentCenterY - totalAttrHeight / 2;

          const newAttrNodes: AttributeNodeType[] = attributesToUse.map((attr, index) => ({
            id: `attr-${attr.toLowerCase()}`,
            type: "attribute",
            position: { x: attrX, y: attrStartY + (index * ATTR_SPACING_Y) },
            data: { label: attr.charAt(0).toUpperCase() + attr.slice(1), color: "#4edea3" }
          }));

          // Place Agent 2 after the attributes column
          const agent2X = sourceX + AGENT_GAP_X;
          const agent2Y = sourceY;
          const agent2 = {
            ...agentDefinitions["fairness-adjudicator"],
            position: { x: agent2X, y: agent2Y },
            data: { ...agentDefinitions["fairness-adjudicator"].data, onRunComplete: handleRunComplete, toolCalls: [], isAgentRunning: true }
          };

          const existingIds = new Set(updatedNodes.map(n => n.id));
          const newAttrFiltered = newAttrNodes.filter(n => !existingIds.has(n.id));
          const allNew = existingIds.has(agent2.id) ? newAttrFiltered : [...newAttrFiltered, agent2];
          return [...updatedNodes, ...allNew];
        });

        // Build edges
        const newEdges: Edge[] = [];
        if (attributesToUse.length > 0) {
          attributesToUse.forEach((attr) => {
            const attrId = `attr-${attr.toLowerCase()}`;
            newEdges.push({
              id: `e-di-${attrId}`,
              source: "data-inspector",
              target: attrId,
              type: "default",
              animated: true,
              style: { stroke: "#4edea3", strokeWidth: 2 }
            });
            newEdges.push({
              id: `e-${attrId}-fa`,
              source: attrId,
              target: "fairness-adjudicator",
              type: "default",
              animated: true,
              style: { stroke: "#4edea3", strokeWidth: 2 }
            });
          });
        } else {
          newEdges.push({
            id: `e-di-fa`,
            source: "data-inspector",
            target: "fairness-adjudicator",
            type: "default",
            animated: true,
            style: { stroke: "#4edea3", strokeWidth: 2 }
          });
        }
        setEdges((eds) => {
          const existingIds = new Set(eds.map(e => e.id));
          const unique = newEdges.filter(e => !existingIds.has(e.id));
          return [...eds, ...unique];
        });

      } else if (nodeId === "fairness-adjudicator") {
        const disparityNodes = ["attr-gender", "attr-age"];
        
        setNodes((nds) => {
          // Color disparity nodes
          const updated = nds.map((n) => {
            const nextN = n.id === nodeId ? ({ ...n, data: { ...n.data, hasRunButton: false } } as typeof n) : n;
            if (disparityNodes.includes(nextN.id)) {
              return { ...nextN, data: { ...nextN.data, color: "#ff5252" } } as typeof nextN;
            }
            return nextN;
          });

          // Find Agent 2's current position to place Agent 3 relative to it
          const sourceNode = updated.find(n => n.id === "fairness-adjudicator");
          const sourceX = sourceNode?.position?.x ?? 1250;
          const sourceY = sourceNode?.position?.y ?? 170;

          const agent3 = {
            ...agentDefinitions["mitigation-expert"],
            position: { x: sourceX + AGENT_DIRECT_GAP_X, y: sourceY },
            data: { ...agentDefinitions["mitigation-expert"].data, onRunComplete: handleRunComplete }
          };

          if (updated.find(n => n.id === "mitigation-expert")) return updated;
          return [...updated, agent3];
        });

        setEdges((eds) => {
          const updated = eds.map((e) => {
            if (e.id === "e-di-gen" || e.id === "e-gen-fa" || e.id === "e-di-age" || e.id === "e-age-fa") {
              return { ...e, style: { ...e.style, stroke: "#ff5252" } };
            }
            return e;
          });
          if (updated.find(e => e.id === "e-fa-me")) return updated;
          return [...updated, { id: "e-fa-me", source: "fairness-adjudicator", target: "mitigation-expert", type: "default", animated: true }];
        });

      } else if (nodeId === "mitigation-expert") {
        const fixedNodes = ["attr-gender", "attr-age"];

        setNodes((nds) => {
          // Color fixed nodes
          const updated = nds.map((n) => {
            const nextN = n.id === nodeId ? ({ ...n, data: { ...n.data, hasRunButton: false } } as typeof n) : n;
            if (fixedNodes.includes(nextN.id)) {
              return { ...nextN, data: { ...nextN.data, color: "#d0bcff" } } as typeof nextN;
            }
            return nextN;
          });

          // Find Agent 3's current position to place Agent 4 relative to it
          const sourceNode = updated.find(n => n.id === "mitigation-expert");
          const sourceX = sourceNode?.position?.x ?? 1700;
          const sourceY = sourceNode?.position?.y ?? 170;

          const agent4 = {
            ...agentDefinitions["report-writer"],
            position: { x: sourceX + AGENT_DIRECT_GAP_X, y: sourceY },
            data: { ...agentDefinitions["report-writer"].data, onRunComplete: handleRunComplete }
          };

          if (updated.find(n => n.id === "report-writer")) return updated;
          return [...updated, agent4];
        });

        setEdges((eds) => {
          const updated = eds.map((e) => {
            if (e.id === "e-di-gen" || e.id === "e-gen-fa" || e.id === "e-di-age" || e.id === "e-age-fa") {
              return { ...e, style: { ...e.style, stroke: "#d0bcff" } };
            }
            return e;
          });
          if (updated.find(e => e.id === "e-me-rw")) return updated;
          return [...updated, { id: "e-me-rw", source: "mitigation-expert", target: "report-writer", type: "default", animated: true }];
        });

      } else if (nodeId === "report-writer") {
        console.log("Final Report Generated");
        setNodes((nds) => nds.map((n) => n.id === nodeId ? ({ ...n, data: { ...n.data, hasRunButton: false } } as typeof n) : n));
      }
    },
    [setNodes, setEdges, discoveredAttributes]
  );

  const handleRunStart = useCallback(
    (nodeId: string) => {
      /* ---------------------------------------------------------------- */
      /*  TEST-DEVELOPER MODE: mock pipeline triggered by Run button      */
      /* ---------------------------------------------------------------- */
      if (viewMode === "test" && nodeId === "data-inspector") {
        const mockAttributes = ["gender", "age", "race", "income"];

        const rawMockToolSets: Record<string, { id: string; name: string; inputs: string; output: string }[]> = {
          "data-inspector": [
            {
              id: "mt-1", name: "bash",
              inputs: '{\n  "command": "python -c \\\"import pandas as pd\\ndf = pd.read_csv(\'data.csv\')\\nprint(f\'Shape: {df.shape}\')\\nprint(f\'Columns: {list(df.columns)}\')\\nprint(df.dtypes)\\\""\n}',
              output: 'Shape: (1000, 12)\nColumns: [\'age\', \'gender\', \'race\', \'income\', \'education\', \'hours_per_week\', \'occupation\', \'marital_status\', \'workclass\', \'native_country\', \'capital_gain\', \'approved\']\n\ndtype:\n  age               int64\n  gender           object\n  race             object\n  income            int64\n  education        object\n  hours_per_week    int64\n  approved          int64'
            },
            {
              id: "mt-2", name: "bash",
              inputs: '{\n  "command": "python profile_dataset.py"\n}',
              output: '══════════════════════════════════════════\n       DATASET PROFILING REPORT\n══════════════════════════════════════════\n\n📊 Rows: 1,000  |  Cols: 12  |  Size: 2.1 MB\n\n┌─────────────────┬──────────┬───────────┐\n│ Column          │ Type     │ Missing % │\n├─────────────────┼──────────┼───────────┤\n│ age             │ int64    │ 0.0%      │\n│ gender          │ category │ 0.0%      │\n│ race            │ category │ 0.2%      │\n│ income          │ int64    │ 0.0%      │\n│ education       │ category │ 0.1%      │\n│ hours_per_week  │ int64    │ 0.0%      │\n│ approved        │ binary   │ 0.0%      │\n└─────────────────┴──────────┴───────────┘\n\n🔍 Protected Attributes Detected:\n   ► gender  (2 groups: Male, Female)\n   ► age     (binned: <25, 25-40, 40-60, 60+)\n   ► race    (4 groups)\n   ► income  (continuous → quartiles)'
            },
            {
              id: "mt-3", name: "bash",
              inputs: '{\n  "command": "python -c \\\"\\nimport pandas as pd\\nimport json\\n\\ndf = pd.read_csv(\'data.csv\')\\nprofile = {\\n    \'rows\': len(df),\\n    \'cols\': len(df.columns),\\n    \'target\': \'approved\',\\n    \'target_rate\': round(df[\'approved\'].mean(), 3),\\n    \'protected_attrs\': [\'gender\', \'age\', \'race\', \'income\'],\\n    \'missing_pct\': 0.3\\n}\\nwith open(\'/workspace/outputs/data_profile.json\', \'w\') as f:\\n    json.dump(profile, f, indent=2)\\nprint(json.dumps(profile, indent=2))\\n\\\""\n}',
              output: '{\n  "rows": 1000,\n  "cols": 12,\n  "target": "approved",\n  "target_rate": 0.421,\n  "protected_attrs": ["gender", "age", "race", "income"],\n  "missing_pct": 0.3\n}\n\n✅ Profile saved to /workspace/outputs/data_profile.json'
            },
          ],
          "fairness-adjudicator": [
            {
              id: "mt-4", name: "list_algorithms",
              inputs: '{\n  "category": "bias_detection"\n}',
              output: '[\n  "disparate_impact_repair",\n  "equality_of_opportunity",\n  "brownian_distance_covariance",\n  "shap_proxy_detection"\n]\n\n→ Selected: disparate_impact_repair (best fit for binary target + categorical protected attrs)'
            },
            {
              id: "mt-5", name: "load_algorithm_knowledge",
              inputs: '{\n  "algorithm": "disparate_impact_repair"\n}',
              output: '📖 Algorithm: Disparate Impact Ratio\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nFormula: DI = P(Y=1|unprivileged) / P(Y=1|privileged)\n\nThreshold: DI ≥ 0.80 (EEOC 4/5 rule)\n  • DI < 0.80  → Adverse impact detected\n  • DI ≥ 0.80  → No evidence of disparity\n\nMethod:\n  1. Compute selection rate per group\n  2. Identify privileged group (highest rate)\n  3. Compare each group\'s rate to privileged\n  4. Flag groups below 80% threshold'
            },
            {
              id: "mt-6", name: "bash",
              inputs: '{\n  "command": "python -c \\\"\\nimport pandas as pd\\nimport numpy as np\\n\\ndf = pd.read_csv(\'data.csv\')\\ntarget = \'approved\'\\n\\ndef disparate_impact(df, attr, target):\\n    rates = df.groupby(attr)[target].mean()\\n    priv_rate = rates.max()\\n    return {g: round(r/priv_rate, 3) for g, r in rates.items()}\\n\\nfor attr in [\'gender\', \'age\', \'race\', \'income\']:\\n    di = disparate_impact(df, attr, target)\\n    print(f\'\\\\n{attr.upper()}:\')\\n    for group, ratio in di.items():\\n        status = \'✓ PASS\' if ratio >= 0.8 else \'⚠️  FAIL\'\\n        bar = \'█\' * int(ratio * 20)\\n        print(f\'  {group:>12}: {bar} {ratio:.2f}  {status}\')\\n\\\""\n}',
              output: 'GENDER:\n         Male: ████████████████████ 1.00  ✓ PASS\n       Female: █████████████▍       0.67  ⚠️  FAIL\n\nAGE:\n        25-40: ████████████████████ 1.00  ✓ PASS\n          <25: ██████████████▍      0.72  ⚠️  FAIL\n        40-60: ████████████████▊    0.84  ✓ PASS\n          60+: ████████████████     0.80  ✓ PASS\n\nRACE:\n        White: ████████████████████ 1.00  ✓ PASS\n        Black: █████████████████    0.85  ✓ PASS\n        Asian: ██████████████████▍  0.92  ✓ PASS\n     Hispanic: █████████████████▌   0.88  ✓ PASS\n\nINCOME (quartiles):\n           Q4: ████████████████████ 1.00  ✓ PASS\n           Q3: ██████████████████▍  0.91  ✓ PASS\n           Q2: ████████████████▊    0.84  ✓ PASS\n           Q1: ██████████████████   0.89  ✓ PASS\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚠️  DISPARITY DETECTED: gender (Female: 0.67), age (<25: 0.72)'
            },
            {
              id: "mt-7", name: "bash",
              inputs: '{\n  "command": "python -c \\\"\\nimport matplotlib.pyplot as plt\\nimport numpy as np\\n\\n# Gender DI Chart\\nfig, axes = plt.subplots(1, 2, figsize=(14, 5))\\n\\ngroups = [\'Male\', \'Female\']\\nvalues = [1.00, 0.67]\\ncolors = [\'#4edea3\', \'#ff5252\']\\naxes[0].barh(groups, values, color=colors)\\naxes[0].axvline(x=0.8, color=\'#ff5252\', linestyle=\'--\', label=\'4/5 Rule\')\\naxes[0].set_title(\'Disparate Impact: Gender\')\\naxes[0].set_xlim(0, 1.2)\\n\\n# Age DI Chart\\ngroups2 = [\'<25\', \'25-40\', \'40-60\', \'60+\']\\nvalues2 = [0.72, 1.00, 0.84, 0.80]\\ncolors2 = [\'#ff5252\', \'#4edea3\', \'#4edea3\', \'#4edea3\']\\naxes[1].barh(groups2, values2, color=colors2)\\naxes[1].axvline(x=0.8, color=\'#ff5252\', linestyle=\'--\')\\naxes[1].set_title(\'Disparate Impact: Age\')\\naxes[1].set_xlim(0, 1.2)\\n\\nplt.tight_layout()\\nplt.savefig(\'/workspace/outputs/disparate_impact.png\', dpi=150)\\nprint(\'Chart saved.\')\\n\\\""\n}',
              output: '📊 Charts generated:\n   /workspace/outputs/disparate_impact.png\n   /workspace/outputs/selection_rates.png\n\n┌─────────────────────────────────────────┐\n│    DISPARATE IMPACT — GENDER            │\n│                                         │\n│  Male   ████████████████████ 1.00 PASS  │\n│  Female █████████████▍       0.67 FAIL  │\n│                  ↑ 0.80 threshold        │\n├─────────────────────────────────────────┤\n│    DISPARATE IMPACT — AGE               │\n│                                         │\n│  <25    ██████████████▍      0.72 FAIL  │\n│  25-40  ████████████████████ 1.00 PASS  │\n│  40-60  ████████████████▊    0.84 PASS  │\n│  60+    ████████████████     0.80 PASS  │\n└─────────────────────────────────────────┘\n\n✅ Bias summary → /workspace/outputs/bias_report.json'
            },
          ],
          "mitigation-expert": [
            {
              id: "mt-8", name: "load_algorithm_knowledge",
              inputs: '{\n  "algorithm": "fairness_feedback_reparation"\n}',
              output: '📖 Algorithm: Iterative Reweighing\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nMethod: Assign instance-level weights to\nequalize selection rates across groups\n\nConvergence: DI ≥ 0.80 for ALL protected groups\nMax iterations: 50\nLearning rate: 0.1\n\nPseudo-code:\n  for i in range(max_iter):\n      weights = compute_reweighing_weights(df, attr)\n      di = compute_DI(df, weights)\n      if all(di >= 0.80): break\n      adjust_weights(learning_rate)'
            },
            {
              id: "mt-9", name: "bash",
              inputs: '{\n  "command": "python -c \\\"\\nimport pandas as pd\\nimport numpy as np\\n\\ndf = pd.read_csv(\'data.csv\')\\n\\ndef reweigh(df, attr, target, lr=0.1, max_iter=50):\\n    weights = np.ones(len(df))\\n    for i in range(max_iter):\\n        rates = {}\\n        for g in df[attr].unique():\\n            mask = df[attr] == g\\n            rates[g] = np.average(df.loc[mask, target], weights=weights[mask])\\n        priv_rate = max(rates.values())\\n        dis = {g: r/priv_rate for g, r in rates.items()}\\n        if all(v >= 0.80 for v in dis.values()):\\n            print(f\'  Converged at iteration {i+1}\')\\n            return weights, dis\\n        for g, d in dis.items():\\n            if d < 0.80:\\n                mask = (df[attr] == g) & (df[target] == 1)\\n                weights[mask] *= (1 + lr)\\n    return weights, dis\\n\\nfor attr in [\'gender\', \'age\']:\\n    print(f\'\\\\nReweighing: {attr}\')\\n    w, di = reweigh(df, attr, \'approved\')\\n    for g, v in di.items():\\n        s = \'✓\' if v >= 0.80 else \'✗\'\\n        print(f\'  {g}: DI={v:.2f} {s}\')\\n\\\""\n}',
              output: 'Reweighing: gender\n  Iter  1: DI(Female)=0.71\n  Iter  2: DI(Female)=0.74\n  Iter  3: DI(Female)=0.78\n  Iter  4: DI(Female)=0.81\n  Converged at iteration 4\n  Male:   DI=1.00 ✓\n  Female: DI=0.81 ✓\n\nReweighing: age\n  Iter  1: DI(<25)=0.75\n  Iter  2: DI(<25)=0.78\n  Iter  3: DI(<25)=0.82\n  Converged at iteration 3\n  <25:   DI=0.82 ✓\n  25-40: DI=1.00 ✓\n  40-60: DI=0.84 ✓\n  60+:   DI=0.80 ✓\n\n✅ Mitigated dataset → /workspace/outputs/mitigated_data.csv'
            },
            {
              id: "mt-10", name: "bash",
              inputs: '{\n  "command": "python -c \\\"\\nfrom sklearn.metrics import accuracy_score, f1_score\\nimport pandas as pd, numpy as np\\n\\norig = pd.read_csv(\'data.csv\')\\nmit = pd.read_csv(\'/workspace/outputs/mitigated_data.csv\')\\n\\nprint(\'══ POST-MITIGATION VALIDATION ══\')\\nprint(f\'Original  Accuracy: {0.862:.3f}\')\\nprint(f\'Mitigated Accuracy: {0.841:.3f}  (Δ = -0.021)\')\\nprint(f\'Original  F1:       {0.847:.3f}\')\\nprint(f\'Mitigated F1:       {0.833:.3f}  (Δ = -0.014)\')\\nprint()\\nprint(\'Fairness Metrics:\')\\nprint(f\'  DI(gender):  0.67 → 0.81  ✓ Fixed\')\\nprint(f\'  DI(age):     0.72 → 0.82  ✓ Fixed\')\\nprint(f\'  DI(race):    0.85 → 0.86  ✓ OK\')\\nprint(f\'  DI(income):  0.91 → 0.91  ✓ OK\')\\nprint()\\nprint(f\'Fairness Score: 92/100\')\\nprint(f\'All groups PASS the 4/5 rule.\')\\n\\\""\n}',
              output: '══ POST-MITIGATION VALIDATION ══\nOriginal  Accuracy: 0.862\nMitigated Accuracy: 0.841  (Δ = -0.021)\nOriginal  F1:       0.847\nMitigated F1:       0.833  (Δ = -0.014)\n\nFairness Metrics:\n  DI(gender):  0.67 → 0.81  ✓ Fixed\n  DI(age):     0.72 → 0.82  ✓ Fixed\n  DI(race):    0.85 → 0.86  ✓ OK\n  DI(income):  0.91 → 0.91  ✓ OK\n\n┌───────────────────────────────────┐\n│  ACCURACY vs FAIRNESS TRADEOFF   │\n│                                   │\n│  Accuracy   ███████████████▊ 84%  │\n│  Fairness   ██████████████████ 92% │\n│  F1 Score   ████████████████▋ 83%  │\n│                                   │\n│  ✅ Acceptable tradeoff (-2.1%)   │\n└───────────────────────────────────┘\n\nFairness Score: 92/100\nAll groups PASS the 4/5 rule.'
            },
          ],
          "report-writer": [
            {
              id: "mt-11", name: "bash",
              inputs: '{\n  "command": "python -c \\\"\\nimport json\\nfrom datetime import datetime\\n\\nreport = {\\n    \'title\': \'Algorithmic Fairness Audit Report\',\\n    \'generated\': datetime.now().isoformat(),\\n    \'sections\': [\\n        \'1. Executive Summary\',\\n        \'2. Dataset Profile\',\\n        \'3. Bias Detection Results\',\\n        \'4. Mitigation Analysis\',\\n        \'5. Before/After Comparison\',\\n        \'6. Recommendations\'\\n    ],\\n    \'charts\': [\\n        \'disparate_impact.png\',\\n        \'selection_rates.png\',\\n        \'accuracy_tradeoff.png\',\\n        \'before_after_di.png\'\\n    ]\\n}\\n\\n# Generate LaTeX PDF\\nimport subprocess\\nsubprocess.run([\'pdflatex\', \'report.tex\'], capture_output=True)\\nprint(\'Report compiled successfully.\')\\n\\\""\n}',
              output: 'Compiling LaTeX report...\n\n📄 FAIRNESS AUDIT REPORT\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSections generated:\n  ✓ 1. Executive Summary\n  ✓ 2. Dataset Profile (1000 rows × 12 cols)\n  ✓ 3. Bias Detection (DI analysis)\n  ✓ 4. Mitigation (Reweighing applied)\n  ✓ 5. Before/After Comparison\n  ✓ 6. Recommendations\n\nEmbedded Charts: 4\nPages: 12\n\n✅ Report → /workspace/outputs/fairness_audit_report.pdf'
            },
            {
              id: "mt-12", name: "read_file",
              inputs: '{\n  "path": "/workspace/outputs/report_summary.txt"\n}',
              output: '╔══════════════════════════════════════════╗\n║     ALGORITHMIC FAIRNESS AUDIT REVIEW    ║\n╠══════════════════════════════════════════╣\n║                                          ║\n║  Dataset:    data.csv                    ║\n║  Records:    1,000 rows × 12 columns     ║\n║  Target:     approved (binary)           ║\n║  Base Rate:  42.1%                       ║\n║                                          ║\n║  ── BIAS DETECTED ──────────────────     ║\n║  • gender (Female):  DI = 0.67  ✗ FAIL  ║\n║  • age    (<25):     DI = 0.72  ✗ FAIL  ║\n║                                          ║\n║  ── MITIGATION APPLIED ─────────────     ║\n║  • Method: Iterative Reweighing          ║\n║  • gender: 0.67 → 0.81  ✓ FIXED         ║\n║  • age:    0.72 → 0.82  ✓ FIXED         ║\n║                                          ║\n║  ── IMPACT ─────────────────────────     ║\n║  • Accuracy:  86.2% → 84.1% (Δ -2.1%)  ║\n║  • F1 Score:  84.7% → 83.3% (Δ -1.4%)  ║\n║  • Fairness:  58/100 → 92/100           ║\n║                                          ║\n║  ── VERDICT ────────────────────────     ║\n║                                          ║\n║    ██████████████████ 92/100  APPROVED   ║\n║                                          ║\n║  All protected groups now satisfy the    ║\n║  EEOC 4/5 rule (DI ≥ 0.80).             ║\n║                                          ║\n╚══════════════════════════════════════════╝'
            },
          ],
        };

        const replacePlaceholders = (str: string) => 
          str.replace(/data\.csv/g, testFileName).replace(/approved/g, testTargetColumn);

        const mockToolSets = Object.fromEntries(
          Object.entries(rawMockToolSets).map(([key, tools]) => [
            key,
            tools.map(tool => ({
              ...tool,
              inputs: replacePlaceholders(tool.inputs),
              output: replacePlaceholders(tool.output)
            }))
          ])
        );

        const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

        const simulateAgent = async (
          agentNodeId: string,
          tools: { id: string; name: string; inputs: string; output: string }[]
        ) => {
          // Mark agent as running
          setNodes((nds) =>
            nds.map((n) =>
              n.id === agentNodeId
                ? ({ ...n, data: { ...n.data, isAgentRunning: true, toolCalls: [] } } as AgentNodeType)
                : n
            )
          );
          await delay(800);

          // Feed tool calls one by one
          for (const tool of tools) {
            // Add tool with "Running..." output
            setNodes((nds) =>
              nds.map((n) => {
                if (n.id !== agentNodeId) return n;
                const current = ((n.data as any).toolCalls as any[]) || [];
                return {
                  ...n,
                  data: {
                    ...n.data,
                    toolCalls: [...current, { ...tool, output: "Running..." }],
                  },
                } as AgentNodeType;
              })
            );
            await delay(1500);

            // Fill in the result
            setNodes((nds) =>
              nds.map((n) => {
                if (n.id !== agentNodeId) return n;
                const current = ((n.data as any).toolCalls as any[]) || [];
                const updated = current.map((tc: any) =>
                  tc.id === tool.id && tc.output === "Running..."
                    ? { ...tc, output: tool.output }
                    : tc
                );
                return { ...n, data: { ...n.data, toolCalls: updated } } as AgentNodeType;
              })
            );
            await delay(500);
          }

          // Mark agent done
          setNodes((nds) =>
            nds.map((n) =>
              n.id === agentNodeId
                ? ({ ...n, data: { ...n.data, isAgentRunning: false } } as AgentNodeType)
                : n
            )
          );
        };

        (async () => {
          // Upload edge animation
          setEdges((eds) =>
            eds.map((e) =>
              e.id === "e-upload-docker"
                ? { ...e, animated: true, style: { stroke: "#4edea3", strokeWidth: 2 } }
                : e
            )
          );
          await delay(1000);

          // Docker: spawning → running
          setDockerStatus("spawning");
          await delay(2000);
          setDockerStatus("running", "mock-container-abc123");
          setEdges((eds) =>
            eds.map((e) =>
              e.id === "e-docker-di"
                ? { ...e, animated: true, style: { stroke: "#4edea3", strokeWidth: 2 } }
                : e
            )
          );
          await delay(1000);

          // ── Agent 1: Data Inspector ──
          await simulateAgent("data-inspector", mockToolSets["data-inspector"]);
          await delay(1000);
          setDiscoveredAttributes(mockAttributes);
          handleRunComplete("data-inspector", mockAttributes);
          await delay(4000);

          // ── Agent 2: Fairness Adjudicator ──
          await simulateAgent("fairness-adjudicator", mockToolSets["fairness-adjudicator"]);
          await delay(500);
          handleRunComplete("fairness-adjudicator");
          await delay(4000);

          // ── Agent 3: Mitigation Expert ──
          await simulateAgent("mitigation-expert", mockToolSets["mitigation-expert"]);
          await delay(500);
          handleRunComplete("mitigation-expert");
          await delay(4000);

          // ── Agent 4: Report Writer ──
          await simulateAgent("report-writer", mockToolSets["report-writer"]);
          await delay(500);
          handleRunComplete("report-writer");

          // Done
          await delay(2000);
          setDockerStatus("stopped");
        })();

        return; // exit early — no WebSocket
      }

      /* ---------------------------------------------------------------- */
      /*  REAL MODE: original WebSocket-based flow                        */
      /* ---------------------------------------------------------------- */
      if (nodeId === "data-inspector") {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? ({ ...n, data: { ...n.data, isAgentRunning: true, toolCalls: [] } } as AgentNodeType)
              : n
          )
        );

        const socket = new WebSocket(`${WS_BASE_URL}/ws/audit`);
        let agent1Finished = false;
        let agent2Finished = false;
        let agent3Finished = false;
        let agent4Finished = false;

        setDockerStatus("spawning");

        socket.onerror = () => {
          setDockerStatus("error");
        };

        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === "status") {
              if (msg.message && msg.message.startsWith("Sandbox started")) {
                const cId = msg.message.replace("Sandbox started: ", "");
                setDockerStatus("running", cId);
                setEdges((eds) =>
                  eds.map((e) =>
                    e.id === "e-docker-di"
                      ? { ...e, animated: true, style: { stroke: "#4edea3", strokeWidth: 2 } }
                      : e
                  )
                );
              }
              return;
            }

            if (msg.type === "error") {
              setDockerStatus("error");
              return;
            }

            if (msg.type === "attributes_discovered") {
              setDiscoveredAttributes(msg.attributes);
              handleRunComplete("data-inspector", msg.attributes);
              return;
            }

            const senderMap: Record<string, string> = {
              "DATA_SURVEYOR": "data-inspector",
              "FAIRNESS_ADJUDICATOR": "fairness-adjudicator",
              "MITIGATION_AGENT": "mitigation-expert",
              "REPORT_COMPILER": "report-writer"
            };
            const targetNodeId = senderMap[msg.sender];

            if (targetNodeId) {
              setNodes((nds) =>
                nds.map((n) => {
                  if (n.id !== targetNodeId) return n;

                  const currentTools = ((n.data as any).toolCalls as any[]) || [];

                  if (msg.type === "tool_calls") {
                    const newTools = msg.tool_calls.map((tc: any) => ({
                      id: tc.id || Math.random().toString(36).substr(2, 9),
                      name: tc.name,
                      inputs: typeof tc.args === "string" ? tc.args : JSON.stringify(tc.args, null, 2),
                      output: "Running...",
                    }));
                    return {
                      ...n,
                      data: { ...n.data, toolCalls: [...currentTools, ...newTools], isAgentRunning: true },
                    } as AgentNodeType;
                  } else if (msg.type === "tool_result") {
                    const updatedTools = [...currentTools];
                    for (let i = updatedTools.length - 1; i >= 0; i--) {
                      if (updatedTools[i].name === msg.name && updatedTools[i].output === "Running...") {
                        updatedTools[i] = { ...updatedTools[i], output: msg.content };
                        break;
                      }
                    }
                    return {
                      ...n,
                      data: { ...n.data, toolCalls: updatedTools },
                    } as AgentNodeType;
                  } else if (msg.type === "message" && !msg.tool_calls) {
                    if (targetNodeId === "data-inspector" && !agent1Finished) {
                      agent1Finished = true;
                      setTimeout(() => {
                        setNodes((currentNds) =>
                          currentNds.map((cn) =>
                            cn.id === "data-inspector"
                              ? ({ ...cn, data: { ...cn.data, isAgentRunning: false } } as AgentNodeType)
                              : cn
                          )
                        );
                        setTimeout(() => {
                          setNodes((nds) => {
                            if (!nds.find(n => n.id === "fairness-adjudicator")) {
                              handleRunComplete("data-inspector", []);
                            }
                            return nds;
                          });
                        }, 2000);
                      }, 500);
                    } else if (targetNodeId === "fairness-adjudicator" && !agent2Finished) {
                      agent2Finished = true;
                      setTimeout(() => {
                        setNodes((currentNds) =>
                          currentNds.map((cn) =>
                            cn.id === "fairness-adjudicator"
                              ? ({ ...cn, data: { ...cn.data, isAgentRunning: false } } as AgentNodeType)
                              : cn
                          )
                        );
                        handleRunComplete("fairness-adjudicator");
                      }, 500);
                    } else if (targetNodeId === "mitigation-expert" && !agent3Finished) {
                      agent3Finished = true;
                      setTimeout(() => {
                        setNodes((currentNds) =>
                          currentNds.map((cn) =>
                            cn.id === "mitigation-expert"
                              ? ({ ...cn, data: { ...cn.data, isAgentRunning: false } } as AgentNodeType)
                              : cn
                          )
                        );
                        handleRunComplete("mitigation-expert");
                      }, 500);
                    } else if (targetNodeId === "report-writer" && !agent4Finished) {
                      agent4Finished = true;
                      setTimeout(() => {
                        setNodes((currentNds) =>
                          currentNds.map((cn) =>
                            cn.id === "report-writer"
                              ? ({ ...cn, data: { ...cn.data, isAgentRunning: false } } as AgentNodeType)
                              : cn
                          )
                        );
                        handleRunComplete("report-writer");
                      }, 500);
                    }
                  }
                  return n;
                })
              );
            }
          } catch (e) {
            console.error("Failed to parse WS message", e);
          }
        };

        socket.onclose = () => {
          console.log("Audit WS closed.");
          setDockerStatus("stopped");
          setNodes((nds) =>
            nds.map((n) =>
              n.id === "data-inspector"
                ? ({ ...n, data: { ...n.data, isAgentRunning: false } } as AgentNodeType)
                : n
            )
          );
        };
      } else {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId ? ({ ...n, data: { ...n.data, isAgentRunning: true } } as AgentNodeType) : n
          )
        );
        setTimeout(() => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId ? ({ ...n, data: { ...n.data, isAgentRunning: false } } as AgentNodeType) : n
            )
          );
          handleRunComplete(nodeId);
        }, 5000);
      }
    },
    [setNodes, setEdges, handleRunComplete, setDockerStatus, viewMode]
  );

  React.useEffect(() => {
    handleRunStartRef.current = handleRunStart;
  }, [handleRunStart]);


  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if ((n.id === "data-inspector" || n.id === "fairness-adjudicator" || n.id === "mitigation-expert" || n.id === "report-writer") && n.type === "agent") {
          return { ...n, data: { ...n.data, onRunComplete: handleRunComplete, onRunStart: handleRunStart } } as AgentNodeType;
        }
        if (n.id === "dataset-upload" && n.type === "upload") {
          return { ...n, data: { ...n.data, onUploadComplete: handleUploadComplete } } as UploadNodeType;
        }
        return n;
      })
    );
  }, [handleRunComplete, handleRunStart, handleUploadComplete, setNodes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: AgentNodeType | AttributeNodeType | UploadNodeType | DockerNodeType) => {
      if (node.type === "agent") {
        setSelectedNodeId(node.id);
      }
    },
    []
  );

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <div className={`mt-[64px] h-[calc(100vh-64px)] relative transition-all duration-300 ease-in-out ${
      isSidebarCollapsed ? "ml-0" : "ml-[260px]"
    }`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        proOptions={proOptions}
        colorMode={"dark" as ColorMode}
        fitView={false}
        minZoom={0.25}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        snapToGrid
        snapGrid={[12, 12]}
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={2}
          color="rgba(180, 180, 195, 0.4)"
        />
        <CanvasControls 
          isLocked={isLocked} 
          onToggleLock={() => setIsLocked(!isLocked)} 
        />
        <MiniMap
          nodeColor={(n) =>
            n.data?.isSelected ? "#d0bcff" : "#494454"
          }
          maskColor="var(--color-background)"
          className="!bg-surface-container-lowest/80 !backdrop-blur-md !border !border-outline-variant !rounded-lg !shadow-2xl"
          pannable
          zoomable
        />
      </ReactFlow>

      {selectedNodeId && (
        <NodeDetailModal
          nodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
          testFileName={testFileName}
          testTargetColumn={testTargetColumn}
        />
      )}

      <AskSidebar />
    </div>
  );
}
