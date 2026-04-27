"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
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
  const { isSidebarCollapsed } = useViewMode();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [discoveredAttributes, setDiscoveredAttributes] = useState<string[]>([]);

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

  const handleUploadComplete = useCallback((fileName: string) => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === "e-upload-docker") {
          return { ...e, animated: true, style: { stroke: "#4edea3", strokeWidth: 2 } };
        }
        return e;
      })
    );
  }, [setEdges]);

  // Horizontal gap between agent nodes
  const AGENT_GAP_X = 450;
  // Vertical spacing between attribute nodes
  const ATTR_SPACING_Y = 120;

  const handleRunComplete = useCallback(
    (nodeId: string, dynamicAttrs?: string[]) => {
      if (nodeId === "data-inspector") {
        const attributesToUse = (dynamicAttrs && dynamicAttrs.length > 0)
          ? dynamicAttrs 
          : discoveredAttributes;

        setNodes((nds) => {
          // Find the source node's current position
          const sourceNode = nds.find(n => n.id === "data-inspector");
          const sourceX = sourceNode?.position?.x ?? 800;
          const sourceY = sourceNode?.position?.y ?? 170;

          // Place attributes between source and next agent
          const attrX = sourceX + AGENT_GAP_X / 2;
          const totalAttrHeight = (attributesToUse.length - 1) * ATTR_SPACING_Y;
          const attrStartY = sourceY - totalAttrHeight / 2 + 30;

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

          return [...nds, ...newAttrNodes, agent2];
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
        setEdges((eds) => [...eds, ...newEdges]);

      } else if (nodeId === "fairness-adjudicator") {
        const disparityNodes = ["attr-gender", "attr-age"];
        
        setNodes((nds) => {
          // Color disparity nodes
          const updated = nds.map((n) => {
            if (disparityNodes.includes(n.id)) {
              return { ...n, data: { ...n.data, color: "#ff5252" } } as typeof n;
            }
            return n;
          });

          // Find Agent 2's current position to place Agent 3 relative to it
          const sourceNode = updated.find(n => n.id === "fairness-adjudicator");
          const sourceX = sourceNode?.position?.x ?? 1250;
          const sourceY = sourceNode?.position?.y ?? 170;

          const agent3 = {
            ...agentDefinitions["mitigation-expert"],
            position: { x: sourceX + AGENT_GAP_X, y: sourceY },
            data: { ...agentDefinitions["mitigation-expert"].data, onRunComplete: handleRunComplete }
          };

          return [...updated, agent3];
        });

        setEdges((eds) => {
          const updated = eds.map((e) => {
            if (e.id === "e-di-gen" || e.id === "e-gen-fa" || e.id === "e-di-age" || e.id === "e-age-fa") {
              return { ...e, style: { ...e.style, stroke: "#ff5252" } };
            }
            return e;
          });
          return [...updated, { id: "e-fa-me", source: "fairness-adjudicator", target: "mitigation-expert", type: "default", animated: true }];
        });

      } else if (nodeId === "mitigation-expert") {
        const fixedNodes = ["attr-gender", "attr-age"];

        setNodes((nds) => {
          // Color fixed nodes
          const updated = nds.map((n) => {
            if (fixedNodes.includes(n.id)) {
              return { ...n, data: { ...n.data, color: "#d0bcff" } } as typeof n;
            }
            return n;
          });

          // Find Agent 3's current position to place Agent 4 relative to it
          const sourceNode = updated.find(n => n.id === "mitigation-expert");
          const sourceX = sourceNode?.position?.x ?? 1700;
          const sourceY = sourceNode?.position?.y ?? 170;

          const agent4 = {
            ...agentDefinitions["report-writer"],
            position: { x: sourceX + AGENT_GAP_X, y: sourceY },
            data: { ...agentDefinitions["report-writer"].data, onRunComplete: handleRunComplete }
          };

          return [...updated, agent4];
        });

        setEdges((eds) => {
          const updated = eds.map((e) => {
            if (e.id === "e-di-gen" || e.id === "e-gen-fa" || e.id === "e-di-age" || e.id === "e-age-fa") {
              return { ...e, style: { ...e.style, stroke: "#d0bcff" } };
            }
            return e;
          });
          return [...updated, { id: "e-me-rw", source: "mitigation-expert", target: "report-writer", type: "default", animated: true }];
        });

      } else if (nodeId === "report-writer") {
        console.log("Final Report Generated");
      }
    },
    [setNodes, setEdges, discoveredAttributes]
  );

  const handleRunStart = useCallback(
    (nodeId: string) => {
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
    [setNodes, setEdges, handleRunComplete, setDockerStatus]
  );

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
          maskColor="rgba(17, 19, 23, 0.8)"
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
    </div>
  );
}
