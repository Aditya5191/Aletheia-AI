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
import { Plus } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Node types registry                                                */
/* ------------------------------------------------------------------ */

const nodeTypes = { agent: AgentNode, attribute: AttributeNode, upload: UploadNode, docker: DockerNode };

/* ------------------------------------------------------------------ */
/*  Initial data                                                       */
/* ------------------------------------------------------------------ */

const initialNodes: (AgentNodeType | AttributeNodeType | UploadNodeType | DockerNodeType)[] = [
  {
    id: "dataset-upload",
    type: "upload",
    position: { x: -450, y: 155 },
    data: {
      title: "Dataset Input",
    },
  } as UploadNodeType,
  {
    id: "docker-sandbox",
    type: "docker",
    position: { x: -30, y: 220 },
    data: {
      status: "idle" as DockerStatus,
    },
  } as DockerNodeType,
  {
    id: "data-inspector",
    type: "agent",
    position: { x: 250, y: 170 },
    data: {
      title: "Data Inspector",
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
  "business-reporter": {
    id: "business-reporter",
    type: "agent",
    position: { x: 1600, y: 170 },
    data: {
      title: "Business Reporter",
      iconType: "brain",
      description: "Generates executive summaries and compliance certificates in plain language.",
      inputLabel: "Mitigated Data",
      outputLabel: "Final Report",
      inputVariant: "default",
      outputVariant: "active",
      hasRunButton: true,
    },
  } as AgentNodeType,
};

/* ------------------------------------------------------------------ */
/*  Custom edge styles                                                 */
/* ------------------------------------------------------------------ */

const defaultEdgeOptions = {
  style: {
    stroke: "#d0bcff",
    strokeWidth: 2,
    filter: "drop-shadow(0 0 4px rgba(208, 188, 255, 0.6))",
  },
  animated: false,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [discoveredAttributes, setDiscoveredAttributes] = useState<string[]>([]);

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
    // Animate the upload → docker edge
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === "e-upload-docker") {
          return { ...e, animated: true, style: { stroke: "#4edea3", strokeWidth: 2 } };
        }
        return e;
      })
    );
  }, [setEdges]);

  const handleRunComplete = useCallback(
    (nodeId: string, dynamicAttrs?: string[]) => {
      if (nodeId === "data-inspector") {
        const attributesToUse = (dynamicAttrs && dynamicAttrs.length > 0)
          ? dynamicAttrs 
          : discoveredAttributes;

        const newNodes: AttributeNodeType[] = attributesToUse.map((attr, index) => ({
          id: `attr-${attr.toLowerCase()}`,
          type: "attribute",
          position: { x: 500, y: 120 + (index * 100) },
          data: { label: attr.charAt(0).toUpperCase() + attr.slice(1), color: "#4edea3" }
        }));

        const newEdges: Edge[] = [];
        if (attributesToUse.length > 0) {
          attributesToUse.forEach((attr) => {
            const attrId = `attr-${attr.toLowerCase()}`;
            // Diverging from Data Inspector
            newEdges.push({
              id: `e-di-${attrId}`,
              source: "data-inspector",
              target: attrId,
              type: "default",
              animated: true,
              style: { stroke: "#4edea3", strokeWidth: 2 }
            });
            // Converging to Agent Auditor
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
          // Direct connection if no attributes are discovered
          newEdges.push({
            id: `e-di-fa`,
            source: "data-inspector",
            target: "fairness-adjudicator",
            type: "default",
            animated: true,
            style: { stroke: "#4edea3", strokeWidth: 2 }
          });
        }
        
        setNodes((nds) => [...nds, ...newNodes]);
        setEdges((eds) => [...eds, ...newEdges]);

        // Spawn Agent 2: Fairness Adjudicator
        const agent2 = { ...agentDefinitions["fairness-adjudicator"], data: { ...agentDefinitions["fairness-adjudicator"].data, onRunComplete: handleRunComplete, toolCalls: [], isAgentRunning: true } };
        setNodes((nds) => [...nds, agent2]);
      } else if (nodeId === "fairness-adjudicator") {
        const disparityNodes = ["attr-gender", "attr-age"];
        
        setNodes((nds) => 
          nds.map((n) => {
            if (disparityNodes.includes(n.id)) {
              return {
                ...n,
                data: { ...n.data, color: "#ff5252" }
              } as typeof n;
            }
            return n;
          })
        );

        setEdges((eds) => 
          eds.map((e) => {
            if (
              e.id === "e-di-gen" || e.id === "e-gen-fa" ||
              e.id === "e-di-age" || e.id === "e-age-fa"
            ) {
              return {
                ...e,
                style: { ...e.style, stroke: "#ff5252" }
              };
            }
            return e;
          })
        );

        // Spawn Agent 3: Mitigation Expert
        const agent3 = { ...agentDefinitions["mitigation-expert"], data: { ...agentDefinitions["mitigation-expert"].data, onRunComplete: handleRunComplete } };
        const edge3 = { id: "e-fa-me", source: "fairness-adjudicator", target: "mitigation-expert", type: "default", animated: true };
        
        setNodes((nds) => [...nds, agent3]);
        setEdges((eds) => [...eds, edge3]);

      } else if (nodeId === "mitigation-expert") {
        // When Agent 3 finishes, turn the red edges back to green or a "fixed" color (e.g., violet)
        const fixedNodes = ["attr-gender", "attr-age"];
        setNodes((nds) => 
          nds.map((n) => {
            if (fixedNodes.includes(n.id)) {
              return {
                ...n,
                data: { ...n.data, color: "#d0bcff" } // Violet for "Fixed"
              } as typeof n;
            }
            return n;
          })
        );

        setEdges((eds) => 
          eds.map((e) => {
            if (
              e.id === "e-di-gen" || e.id === "e-gen-fa" ||
              e.id === "e-di-age" || e.id === "e-age-fa"
            ) {
              return {
                ...e,
                style: { ...e.style, stroke: "#d0bcff" }
              };
            }
            return e;
          })
        );

        // Spawn Agent 4: Business Reporter
        const agent4 = { ...agentDefinitions["business-reporter"], data: { ...agentDefinitions["business-reporter"].data, onRunComplete: handleRunComplete } };
        const edge4 = { id: "e-me-br", source: "mitigation-expert", target: "business-reporter", type: "default", animated: true };
        
        setNodes((nds) => [...nds, agent4]);
        setEdges((eds) => [...eds, edge4]);

      } else if (nodeId === "business-reporter") {
        console.log("Business Report Generated");
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

        const socket = new WebSocket("ws://localhost:8005/ws/audit");
        let agent1Finished = false;
        let agent2Finished = false;
        let agent3Finished = false;

        // Docker spawning animation
        setDockerStatus("spawning");

        socket.onclose = () => {
          setDockerStatus("stopped");
        };

        socket.onerror = () => {
          setDockerStatus("error");
        };

        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === "status") {
              console.log("Status:", msg.message);
              // Detect sandbox started message to transition Docker node
              if (msg.message && msg.message.startsWith("Sandbox started")) {
                const cId = msg.message.replace("Sandbox started: ", "");
                setDockerStatus("running", cId);
                // Animate docker → data-inspector edge
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
              console.log("Attributes Discovered:", msg.attributes);
              setDiscoveredAttributes(msg.attributes);
              handleRunComplete("data-inspector", msg.attributes);
              return;
            }

            const senderMap: Record<string, string> = {
              "DATA_SURVEYOR": "data-inspector",
              "FAIRNESS_ADJUDICATOR": "fairness-adjudicator",
              "MITIGATION_AGENT": "mitigation-expert"
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
                    // Find the last tool with matching name that is still running
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
                        // We do NOT call handleRunComplete here. 
                        // It will be called by the "attributes_discovered" message handler.
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
          setNodes((nds) =>
            nds.map((n) =>
              n.id === "data-inspector"
                ? ({ ...n, data: { ...n.data, isAgentRunning: false } } as AgentNodeType)
                : n
            )
          );
        };
      } else {
        // Fallback simulated execution for other agents
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
    [setNodes, handleRunComplete]
  );

  // Attach callbacks on mount
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if ((n.id === "data-inspector" || n.id === "fairness-adjudicator" || n.id === "mitigation-expert" || n.id === "business-reporter") && n.type === "agent") {
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
    <div className="ml-[260px] mt-[64px] h-[calc(100vh-64px)] relative">
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

      {/* Floating Add Agent Node Button */}
      <button className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full shadow-[0_8px_32px_rgba(208,188,255,0.2)] hover:bg-primary-container hover:text-on-primary-container transition-all hover:scale-105 text-[13px] font-semibold tracking-[0.05em] cursor-pointer">
        <Plus className="w-5 h-5" />
        Add Agent Node
      </button>

      {selectedNodeId && (
        <NodeDetailModal
          nodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}
