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
import ModelUploadNode, { type ModelUploadNodeType } from "./ModelUploadNode";
import DockerNode, { type DockerNodeType, type DockerStatus } from "./DockerNode";
import NodeDetailModal from "./NodeDetailModal";
import CanvasControls from "./CanvasControls";
import AskSidebar from "./AskSidebar";

import { useViewMode } from "./ViewModeContext";
import { MODEL_WS_BASE_URL } from "../lib/config";

/* ------------------------------------------------------------------ */
/*  Agent definitions per model_type                                  */
/* ------------------------------------------------------------------ */

const AGENT_DEFS = {
  classification: {
    agent1: { title: "Model Inspector",       iconType: "database" as const, description: "Loads and profiles the uploaded classification model, generates predictions on the sample data, and detects protected attributes." },
    agent2: { title: "Behavioral Auditor",    iconType: "brain"    as const, description: "Audits model predictions for demographic disparities. Selects and applies a fairness algorithm from the knowledge library." },
    agent3: { title: "Threshold Calibrator",  iconType: "code"     as const, description: "Applies per-group classification threshold adjustments to satisfy equalized odds or equal opportunity constraints." },
    agent4: { title: "Report Compiler",       iconType: "code"     as const, description: "Assembles all audit findings, before/after charts, and metrics into a final PDF report." },
    senderMap: {
      "MODEL_INSPECTOR":      "model-inspector",
      "BEHAVIORAL_AUDITOR":   "behavioral-auditor",
      "THRESHOLD_CALIBRATOR": "threshold-calibrator",
      "REPORT_COMPILER":      "report-compiler",
    },
  },
  regression: {
    agent1: { title: "Model Profiler",       iconType: "database" as const, description: "Loads and profiles the uploaded regression model, generates predictions on the sample data, and identifies protected attributes." },
    agent2: { title: "Disparity Auditor",    iconType: "brain"    as const, description: "Measures prediction disparities across demographic groups. Selects the most appropriate fairness algorithm for regression outputs." },
    agent3: { title: "Output Recalibrator",  iconType: "code"     as const, description: "Applies group-conditional recalibration to correct systematic prediction biases without retraining the model." },
    agent4: { title: "Report Compiler",      iconType: "code"     as const, description: "Assembles all audit findings, before/after charts, and metrics into a final PDF report." },
    senderMap: {
      "MODEL_PROFILER":      "model-inspector",
      "DISPARITY_AUDITOR":   "behavioral-auditor",
      "OUTPUT_RECALIBRATOR": "threshold-calibrator",
      "REPORT_COMPILER":     "report-compiler",
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Initial nodes / edges                                             */
/* ------------------------------------------------------------------ */

type ModelCanvasNode = ModelUploadNodeType | DockerNodeType | AgentNodeType | AttributeNodeType;

const makeInitialNodes = (): ModelCanvasNode[] => [
  {
    id: "model-upload",
    type: "model-upload",
    position: { x: 100, y: 155 },
    data: { title: "Model Input" },
  } as ModelUploadNodeType,
  {
    id: "docker-sandbox",
    type: "docker",
    position: { x: 540, y: 220 },
    data: { status: "idle" as DockerStatus },
  } as DockerNodeType,
  {
    id: "model-inspector",
    type: "agent",
    position: { x: 820, y: 170 },
    data: {
      title: "Model Inspector",
      iconType: "database",
      description: "Loads and profiles the uploaded model, generates predictions, and detects protected attributes.",
      inputLabel: "Model + Sample",
      outputLabel: "Predictions",
      inputVariant: "default",
      outputVariant: "active",
      toolCalls: [],
      hasRunButton: true,
    },
  } as AgentNodeType,
];

const initialEdges: Edge[] = [
  {
    id: "e-upload-docker",
    source: "model-upload",
    target: "docker-sandbox",
    type: "default",
    animated: false,
    style: { stroke: "#958ea0", strokeWidth: 2, strokeDasharray: "6 4" },
  },
  {
    id: "e-docker-mi",
    source: "docker-sandbox",
    target: "model-inspector",
    type: "default",
    animated: false,
    style: { stroke: "#958ea0", strokeWidth: 2, strokeDasharray: "6 4" },
  },
];

const defaultEdgeOptions = {
  style: {
    stroke: "#64c8ff",
    strokeWidth: 2,
    filter: "drop-shadow(0 0 4px rgba(100, 200, 255, 0.6))",
  },
  animated: false,
};

const AGENT_GAP_X      = 600;
const AGENT_DIRECT_GAP = 400;
const ATTR_SPACING_Y   = 70;
const AGENT_CARD_W     = 300;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ModelFlowCanvas() {
  const { isSidebarCollapsed, viewMode } = useViewMode();
  const [nodes, setNodes, onNodesChange] = useNodesState(makeInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [modelType, setModelType] = useState<"classification" | "regression">("classification");
  const [discoveredAttributes, setDiscoveredAttributes] = useState<string[]>([]);



  const nodeTypes = useMemo(() => ({
    agent: AgentNode,
    attribute: AttributeNode,
    "model-upload": ModelUploadNode,
    docker: DockerNode,
  }), []);

  const defs = AGENT_DEFS[modelType];

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

  const handleUploadComplete = useCallback((uploadedModelType: string) => {
    const newModelType = uploadedModelType === "regression" ? "regression" : "classification";
    setModelType(newModelType);

    setNodes(makeInitialNodes());
    setDiscoveredAttributes([]);

    setEdges(initialEdges.map((e) =>
      e.id === "e-upload-docker"
        ? { ...e, animated: true, style: { stroke: "#64c8ff", strokeWidth: 2 } }
        : e
    ));

    setTimeout(() => {
      handleRunStartRef.current("model-inspector");
    }, 300);
  }, [setNodes, setEdges]);



  // Update agent1 title when modelType changes
  useEffect(() => {
    const d = AGENT_DEFS[modelType];
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "model-inspector" && n.type === "agent"
          ? { ...n, data: { ...n.data, title: d.agent1.title, description: d.agent1.description } } as AgentNodeType
          : n
      )
    );
  }, [modelType, setNodes]);

  /* ---------------------------------------------------------------- */
  /*  handleRunComplete — adds next agent + attribute nodes           */
  /* ---------------------------------------------------------------- */
  const handleRunComplete = useCallback(
    (nodeId: string, dynamicAttrs?: string[]) => {
      const d = AGENT_DEFS[modelType];

      if (nodeId === "model-inspector") {
        const attrs = (dynamicAttrs && dynamicAttrs.length > 0) ? dynamicAttrs : discoveredAttributes;

        setNodes((nds) => {
          const updatedNodes = nds.map((n) => n.id === nodeId ? ({ ...n, data: { ...n.data, hasRunButton: false } } as typeof n) : n);
          const src = updatedNodes.find((n) => n.id === "model-inspector");
          const srcX = src?.position?.x ?? 820;
          const srcY = src?.position?.y ?? 170;

          const attrX      = srcX + AGENT_CARD_W + (AGENT_GAP_X - AGENT_CARD_W) / 2 - 40;
          const totalH     = (attrs.length - 1) * ATTR_SPACING_Y;
          const attrStartY = srcY + 130 - totalH / 2;

          const attrNodes: AttributeNodeType[] = attrs.map((attr, i) => ({
            id: `attr-${attr.toLowerCase().replace(/\s+/g, "-")}`,
            type: "attribute",
            position: { x: attrX, y: attrStartY + i * ATTR_SPACING_Y },
            data: { label: attr.charAt(0).toUpperCase() + attr.slice(1), color: "#64c8ff" },
          }));

          const agent2: AgentNodeType = {
            id: "behavioral-auditor",
            type: "agent",
            position: { x: srcX + AGENT_GAP_X, y: srcY },
            data: {
              title: d.agent2.title,
              iconType: d.agent2.iconType,
              description: d.agent2.description,
              inputLabel: "Predictions",
              outputLabel: "Audit Report",
              inputVariant: "active",
              outputVariant: "active",
              toolCalls: [],
              hasRunButton: true,
              isAgentRunning: true,
            },
          };

          const existingIds = new Set(updatedNodes.map((n) => n.id));
          const newAttr = attrNodes.filter((n) => !existingIds.has(n.id));
          const newNodes = existingIds.has("behavioral-auditor") ? newAttr : [...newAttr, agent2];
          return [...updatedNodes, ...newNodes];
        });

        // Edges: inspector → attrs → auditor (or direct)
        const newEdges: Edge[] = [];
        const edgeAttrs = (dynamicAttrs && dynamicAttrs.length > 0) ? dynamicAttrs : discoveredAttributes;
        if (edgeAttrs.length > 0) {
          edgeAttrs.forEach((attr) => {
            const attrId = `attr-${attr.toLowerCase().replace(/\s+/g, "-")}`;
            newEdges.push({ id: `e-mi-${attrId}`, source: "model-inspector", target: attrId, type: "default", animated: true, style: { stroke: "#64c8ff", strokeWidth: 2 } });
            newEdges.push({ id: `e-${attrId}-ba`, source: attrId, target: "behavioral-auditor", type: "default", animated: true, style: { stroke: "#64c8ff", strokeWidth: 2 } });
          });
        } else {
          newEdges.push({ id: "e-mi-ba", source: "model-inspector", target: "behavioral-auditor", type: "default", animated: true, style: { stroke: "#64c8ff", strokeWidth: 2 } });
        }
        setEdges((eds) => {
          const existing = new Set(eds.map((e) => e.id));
          return [...eds, ...newEdges.filter((e) => !existing.has(e.id))];
        });

      } else if (nodeId === "behavioral-auditor") {
        setNodes((nds) => {
          // Mark disparity attributes red
          const updated = nds.map((n) => {
            const nextN = n.id === nodeId ? ({ ...n, data: { ...n.data, hasRunButton: false } } as typeof n) : n;
            return nextN.id.startsWith("attr-") ? { ...nextN, data: { ...nextN.data, color: "#ff5252" } } as AttributeNodeType : nextN;
          });
          const src = updated.find((n) => n.id === "behavioral-auditor");
          const srcX = src?.position?.x ?? 1420;
          const srcY = src?.position?.y ?? 170;

          const agent3: AgentNodeType = {
            id: "threshold-calibrator",
            type: "agent",
            position: { x: srcX + AGENT_DIRECT_GAP, y: srcY },
            data: {
              title: d.agent3.title,
              iconType: d.agent3.iconType,
              description: d.agent3.description,
              inputLabel: "Audit",
              outputLabel: "Fixed",
              inputVariant: "active",
              outputVariant: "active",
              toolCalls: [],
              hasRunButton: true,
            },
          };
          if (updated.find((n) => n.id === "threshold-calibrator")) return updated;
          return [...updated, agent3];
        });

        setEdges((eds) => {
          if (eds.find((e) => e.id === "e-ba-tc")) return eds;
          return [...eds, { id: "e-ba-tc", source: "behavioral-auditor", target: "threshold-calibrator", type: "default", animated: true, style: { stroke: "#ff5252", strokeWidth: 2 } }];
        });

      } else if (nodeId === "threshold-calibrator") {
        setNodes((nds) => {
          // Mark attrs purple (mitigated)
          const updated = nds.map((n) => {
            const nextN = n.id === nodeId ? ({ ...n, data: { ...n.data, hasRunButton: false } } as typeof n) : n;
            return nextN.id.startsWith("attr-") ? { ...nextN, data: { ...nextN.data, color: "#d0bcff" } } as AttributeNodeType : nextN;
          });
          const src = updated.find((n) => n.id === "threshold-calibrator");
          const srcX = src?.position?.x ?? 1820;
          const srcY = src?.position?.y ?? 170;

          const agent4: AgentNodeType = {
            id: "report-compiler",
            type: "agent",
            position: { x: srcX + AGENT_DIRECT_GAP, y: srcY },
            data: {
              title: d.agent4.title,
              iconType: d.agent4.iconType,
              description: d.agent4.description,
              inputLabel: "All Reports",
              outputLabel: "Final PDF",
              inputVariant: "active",
              outputVariant: "active",
              toolCalls: [],
              hasRunButton: true,
            },
          };
          if (updated.find((n) => n.id === "report-compiler")) return updated;
          return [...updated, agent4];
        });

        setEdges((eds) => {
          const updatedEdges = eds.map((e) =>
            e.id === "e-ba-tc" ? { ...e, style: { ...e.style, stroke: "#d0bcff" } } : e
          );
          if (updatedEdges.find((e) => e.id === "e-tc-rc")) return updatedEdges;
          return [...updatedEdges, { id: "e-tc-rc", source: "threshold-calibrator", target: "report-compiler", type: "default", animated: true, style: { stroke: "#d0bcff", strokeWidth: 2 } }];
        });

      } else if (nodeId === "report-compiler") {
        console.log("[ModelFlowCanvas] Audit complete.");
        setNodes((nds) => nds.map((n) => n.id === nodeId ? ({ ...n, data: { ...n.data, hasRunButton: false } } as typeof n) : n));
      }
    },
    [setNodes, setEdges, modelType, discoveredAttributes]
  );

  /* ---------------------------------------------------------------- */
  /*  handleRunStart — connects to /ws/model_audit                   */
  /* ---------------------------------------------------------------- */
  const handleRunStart = useCallback(
    (nodeId: string) => {
      if (nodeId !== "model-inspector") return;

      /* ---------------------------------------------------------------- */
      /*  TEST-DEVELOPER MODE: mock pipeline triggered by Run button      */
      /* ---------------------------------------------------------------- */
      if (viewMode === "test") {
        const mockAttributes = ["gender", "age", "race", "income"];

        const mockToolSets: Record<string, { id: string; name: string; inputs: string; output: string }[]> = {
          "model-inspector": [
            {
              id: "mt-1", name: "bash",
              inputs: '{\n  "command": "python -c \\\"import joblib, pandas as pd\\nmodel = joblib.load(\'model.pkl\')\\ndf = pd.read_csv(\'sample.csv\')\\nprint(f\'Model Type: RandomForestClassifier\')\\nprint(f\'Sample Shape: {df.shape}\')\\nprint(f\'Features: {list(df.columns)}\')\\\""\n}',
              output: 'Model Type: RandomForestClassifier\nSample Shape: (1000, 11)\nFeatures: [\'age\', \'gender\', \'race\', \'income\', \'education\', \'hours_per_week\', \'occupation\', \'marital_status\', \'workclass\', \'native_country\', \'capital_gain\']'
            },
            {
              id: "mt-2", name: "bash",
              inputs: '{\n  "command": "python profile_model_predictions.py"\n}',
              output: '══════════════════════════════════════════\n     MODEL PREDICTION PROFILING REPORT\n══════════════════════════════════════════\n\n📊 Generating predictions on 1,000 samples...\n\nBase Positive Prediction Rate: 41.5%\n\n🔍 Protected Attributes Detected:\n   ► gender  (2 groups: Male, Female)\n   ► age     (binned: <25, 25-40, 40-60, 60+)\n   ► race    (4 groups)\n   ► income  (continuous → quartiles)\n\n✅ Profile saved to /workspace/outputs/model_profile.json'
            }
          ],
          "behavioral-auditor": [
            {
              id: "mt-3", name: "list_algorithms",
              inputs: '{\n  "category": "bias_detection"\n}',
              output: '[\n  "equal_opportunity",\n  "equalized_odds",\n  "predictive_parity",\n  "disparate_impact_ratio"\n]\n\n→ Selected: equalized_odds (evaluates both False Positive Rate and True Positive Rate)'
            },
            {
              id: "mt-4", name: "bash",
              inputs: '{\n  "command": "python evaluate_fairness.py"\n}',
              output: 'GENDER:\n         Male: TPR=0.85, FPR=0.15  ✓\n       Female: TPR=0.62, FPR=0.38  ⚠️  FAIL (High False Alarm Rate)\n\nAGE:\n        25-40: TPR=0.82, FPR=0.18  ✓\n          <25: TPR=0.55, FPR=0.45  ⚠️  FAIL (High False Alarm Rate)\n        40-60: TPR=0.80, FPR=0.19  ✓\n          60+: TPR=0.78, FPR=0.20  ✓\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚠️  DISPARITY DETECTED: gender (FPR 0.38 vs 0.15), age (<25 FPR 0.45 vs 0.18)'
            },
            {
              id: "mt-5", name: "bash",
              inputs: '{\n  "command": "python -c \\\"import matplotlib.pyplot as plt\\nprint(\'Charts generated.\')\\\""\n}',
              output: '📊 Charts generated:\n   /workspace/outputs/roc_curves.png\n   /workspace/outputs/fpr_disparities.png\n\n✅ Bias summary → /workspace/outputs/model_bias_report.json'
            }
          ],
          "threshold-calibrator": [
            {
              id: "mt-6", name: "load_algorithm_knowledge",
              inputs: '{\n  "algorithm": "equalized_odds_postprocessing"\n}',
              output: '📖 Algorithm: Equalized Odds Threshold Calibration\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nMethod: Solve linear program to find group-specific thresholds \nthat align True Positive Rates (TPR) and False Positive Rates (FPR)\nacross all demographic groups.\n\nConstraint: TPR_a ≈ TPR_b AND FPR_a ≈ FPR_b\n'
            },
            {
              id: "mt-7", name: "bash",
              inputs: '{\n  "command": "python run_calibration.py"\n}',
              output: 'Calibrating Thresholds for GENDER...\n  Male Threshold:   0.50 → 0.51\n  Female Threshold: 0.50 → 0.63\n\nCalibrating Thresholds for AGE...\n  <25 Threshold:    0.50 → 0.65\n  25-40 Threshold:  0.50 → 0.49\n  40-60 Threshold:  0.50 → 0.50\n  60+ Threshold:    0.50 → 0.50\n\nNew Metrics:\n  Male:   TPR=0.81, FPR=0.16\n  Female: TPR=0.79, FPR=0.17  ✓ Aligned\n  <25:    TPR=0.75, FPR=0.18  ✓ Aligned\n\n✅ Calibrated model wrapper saved → /workspace/outputs/calibrated_model.pkl'
            }
          ],
          "report-compiler": [
            {
              id: "mt-8", name: "bash",
              inputs: '{\n  "command": "python compile_report.py"\n}',
              output: 'Compiling LaTeX report...\n\n📄 MODEL FAIRNESS AUDIT REPORT\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSections generated:\n  ✓ 1. Model Profile & Dataset Summary\n  ✓ 2. Pre-Calibration Metrics (FPR/TPR)\n  ✓ 3. Equalized Odds Post-processing\n  ✓ 4. Post-Calibration Validation\n\nEmbedded Charts: 3\nPages: 9\n\n✅ Report → /workspace/outputs/model_audit_report.pdf'
            },
            {
              id: "mt-9", name: "read_file",
              inputs: '{\n  "path": "/workspace/outputs/report_summary.txt"\n}',
              output: '╔══════════════════════════════════════════╗\n║         MODEL FAIRNESS AUDIT REVIEW      ║\n╠══════════════════════════════════════════╣\n║                                          ║\n║  Model Type: RandomForestClassifier      ║\n║                                          ║\n║  ── BIAS DETECTED ──────────────────     ║\n║  • gender (Female):  FPR = 0.38 ✗ FAIL  ║\n║  • age    (<25):     FPR = 0.45 ✗ FAIL  ║\n║                                          ║\n║  ── MITIGATION APPLIED ─────────────     ║\n║  • Method: Equalized Odds Calibration    ║\n║  • gender (Female):  Threshold = 0.63    ║\n║  • age (<25):        Threshold = 0.65    ║\n║                                          ║\n║  ── IMPACT ─────────────────────────     ║\n║  • Female FPR: 0.38 → 0.17  ✓ FIXED     ║\n║  • <25 FPR:    0.45 → 0.18  ✓ FIXED     ║\n║  • Accuracy:   85.2% → 83.1% (Δ -2.1%) ║\n║                                          ║\n║  ── VERDICT ────────────────────────     ║\n║                                          ║\n║    ██████████████████ 95/100  APPROVED   ║\n║                                          ║\n║  False Positive and True Positive Rates  ║\n║  are now aligned across all groups.      ║\n║                                          ║\n╚══════════════════════════════════════════╝'
            }
          ]
        };

        const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

        const simulateAgent = async (
          agentNodeId: string,
          tools: { id: string; name: string; inputs: string; output: string }[]
        ) => {
          setNodes((nds) => nds.map((n) => n.id === agentNodeId ? ({ ...n, data: { ...n.data, isAgentRunning: true, toolCalls: [] } } as AgentNodeType) : n));
          await delay(800);

          for (const tool of tools) {
            setNodes((nds) => nds.map((n) => {
              if (n.id !== agentNodeId) return n;
              const current = ((n.data as any).toolCalls as any[]) || [];
              return { ...n, data: { ...n.data, toolCalls: [...current, { ...tool, output: "Running..." }] } } as AgentNodeType;
            }));
            await delay(1500);

            setNodes((nds) => nds.map((n) => {
              if (n.id !== agentNodeId) return n;
              const current = ((n.data as any).toolCalls as any[]) || [];
              const updated = current.map((tc: any) => tc.id === tool.id && tc.output === "Running..." ? { ...tc, output: tool.output } : tc);
              return { ...n, data: { ...n.data, toolCalls: updated } } as AgentNodeType;
            }));
            await delay(500);
          }

          setNodes((nds) => nds.map((n) => n.id === agentNodeId ? ({ ...n, data: { ...n.data, isAgentRunning: false } } as AgentNodeType) : n));
        };

        (async () => {
          setEdges((eds) => eds.map((e) => e.id === "e-upload-docker" ? { ...e, animated: true, style: { stroke: "#64c8ff", strokeWidth: 2 } } : e));
          await delay(1000);

          setDockerStatus("spawning");
          await delay(2000);
          setDockerStatus("running", "mock-container-abc123");
          setEdges((eds) => eds.map((e) => e.id === "e-docker-mi" ? { ...e, animated: true, style: { stroke: "#64c8ff", strokeWidth: 2 } } : e));
          await delay(1000);

          await simulateAgent("model-inspector", mockToolSets["model-inspector"]);
          await delay(1000);
          setDiscoveredAttributes(mockAttributes);
          handleRunComplete("model-inspector", mockAttributes);
          await delay(4000);

          await simulateAgent("behavioral-auditor", mockToolSets["behavioral-auditor"]);
          await delay(500);
          handleRunComplete("behavioral-auditor");
          await delay(4000);

          await simulateAgent("threshold-calibrator", mockToolSets["threshold-calibrator"]);
          await delay(500);
          handleRunComplete("threshold-calibrator");
          await delay(4000);

          await simulateAgent("report-compiler", mockToolSets["report-compiler"]);
          await delay(500);
          handleRunComplete("report-compiler");

          await delay(2000);
          setDockerStatus("stopped");
        })();

        return; // exit early
      }

      /* ---------------------------------------------------------------- */
      /*  REAL MODE: original WebSocket-based flow                        */
      /* ---------------------------------------------------------------- */


      setNodes((nds) =>
        nds.map((n) =>
          n.id === "model-inspector"
            ? ({ ...n, data: { ...n.data, isAgentRunning: true, toolCalls: [] } } as AgentNodeType)
            : n
        )
      );

      setDockerStatus("spawning");

      const socket = new WebSocket(`${MODEL_WS_BASE_URL}/ws/model_audit`);

      let agent1Done = false;
      let agent2Done = false;
      let agent3Done = false;
      let agent4Done = false;

      socket.onerror = () => setDockerStatus("error");

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "status") {
            if (msg.model_type) {
              const mt = msg.model_type as "classification" | "regression";
              setModelType(mt);
            }
            if (msg.message?.startsWith("Sandbox started")) {
              const cId = msg.message.replace("Sandbox started: ", "");
              setDockerStatus("running", cId);
              setEdges((eds) =>
                eds.map((e) =>
                  e.id === "e-docker-mi"
                    ? { ...e, animated: true, style: { stroke: "#64c8ff", strokeWidth: 2 } }
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
            setDiscoveredAttributes(msg.attributes ?? []);
            handleRunComplete("model-inspector", msg.attributes ?? []);
            return;
          }

          // Resolve sender → node id using current modelType's senderMap
          const senderMap = AGENT_DEFS[modelType].senderMap as Record<string, string>;
          const targetNodeId = msg.sender ? senderMap[msg.sender] : undefined;

          if (targetNodeId) {
            setNodes((nds) =>
              nds.map((n) => {
                if (n.id !== targetNodeId) return n;
                const currentTools = ((n.data as any).toolCalls as any[]) || [];

                if (msg.type === "tool_calls") {
                  const newTools = (msg.tool_calls ?? []).map((tc: any) => ({
                    id: tc.id || Math.random().toString(36).substr(2, 9),
                    name: tc.name,
                    inputs: typeof tc.args === "string" ? tc.args : JSON.stringify(tc.args, null, 2),
                    output: "Running...",
                  }));
                  return { ...n, data: { ...n.data, toolCalls: [...currentTools, ...newTools], isAgentRunning: true } } as AgentNodeType;
                }

                if (msg.type === "tool_result") {
                  const updated = [...currentTools];
                  for (let i = updated.length - 1; i >= 0; i--) {
                    if (updated[i].name === msg.name && updated[i].output === "Running...") {
                      updated[i] = { ...updated[i], output: msg.content };
                      break;
                    }
                  }
                  return { ...n, data: { ...n.data, toolCalls: updated } } as AgentNodeType;
                }

                if (msg.type === "message" && !msg.tool_calls) {
                  const markDone = (id: string) => {
                    setTimeout(() => {
                      setNodes((cur) =>
                        cur.map((cn) =>
                          cn.id === id ? ({ ...cn, data: { ...cn.data, isAgentRunning: false } } as AgentNodeType) : cn
                        )
                      );
                    }, 500);
                  };

                  if (targetNodeId === "model-inspector" && !agent1Done) {
                    agent1Done = true;
                    markDone("model-inspector");
                    setTimeout(() => {
                      setNodes((cur) => {
                        if (!cur.find((n) => n.id === "behavioral-auditor")) {
                          handleRunComplete("model-inspector", []);
                        }
                        return cur;
                      });
                    }, 2500);
                  } else if (targetNodeId === "behavioral-auditor" && !agent2Done) {
                    agent2Done = true;
                    markDone("behavioral-auditor");
                    setTimeout(() => handleRunComplete("behavioral-auditor"), 500);
                  } else if (targetNodeId === "threshold-calibrator" && !agent3Done) {
                    agent3Done = true;
                    markDone("threshold-calibrator");
                    setTimeout(() => handleRunComplete("threshold-calibrator"), 500);
                  } else if (targetNodeId === "report-compiler" && !agent4Done) {
                    agent4Done = true;
                    markDone("report-compiler");
                    setTimeout(() => handleRunComplete("report-compiler"), 500);
                  }
                }
                return n;
              })
            );
          }
        } catch (e) {
          console.error("[ModelFlowCanvas] Failed to parse WS message", e);
        }
      };

      socket.onclose = () => {
        setDockerStatus("stopped");
        setNodes((nds) =>
          nds.map((n) =>
            n.id === "model-inspector"
              ? ({ ...n, data: { ...n.data, isAgentRunning: false } } as AgentNodeType)
              : n
          )
        );
      };
    },
    [setNodes, setEdges, setDockerStatus, handleRunComplete, modelType]
  );

  useEffect(() => {
    handleRunStartRef.current = handleRunStart;
  }, [handleRunStart]);


  // Wire callbacks into nodes whenever they change
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.type === "agent") {
          return { ...n, data: { ...n.data, onRunComplete: handleRunComplete, onRunStart: handleRunStart } } as AgentNodeType;
        }
        if (n.id === "model-upload" && n.type === "model-upload") {
          return { ...n, data: { ...n.data, onUploadComplete: handleUploadComplete, onTypeChange: (type: string) => setModelType(type as "classification" | "regression") } } as ModelUploadNodeType;
        }
        return n;
      })
    );
  }, [handleRunComplete, handleRunStart, handleUploadComplete, setNodes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      if (node.type === "agent") setSelectedNodeId(node.id);
    },
    []
  );

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <div
      className={`mt-[64px] h-[calc(100vh-64px)] relative transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "ml-0" : "ml-[260px]"
      }`}
    >
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
          nodeColor={(n) => (n.data?.isSelected ? "#64c8ff" : "#494454")}
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
        />
      )}

      <AskSidebar />
    </div>
  );
}
