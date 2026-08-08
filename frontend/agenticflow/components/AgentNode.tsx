"use client";

import { memo, useState, useEffect, useRef } from "react";
import { Handle, Position, type NodeProps, type Node, useUpdateNodeInternals } from "@xyflow/react";
import { Database, Brain, Code, MoreHorizontal, ChevronDown, ChevronUp, Clock, Wrench, Play, Loader2 } from "lucide-react";
import { useViewMode } from "./ViewModeContext";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AgentNodeData {
  title: string;
  iconType: "database" | "brain" | "code";
  description?: string;
  inputLabel: string;
  outputLabel: string;
  inputVariant?: "active" | "default";
  outputVariant?: "active" | "default";
  statusBadge?: { label: string; color: string };
  confidenceScore?: number;
  isSelected?: boolean;
  hasRunButton?: boolean;
  toolCalls?: { id: string; name: string; inputs: any; output: string }[];
  isAgentRunning?: boolean;
  onRunStart?: (nodeId: string) => void;
  onRunComplete?: (nodeId: string) => void;
  [key: string]: unknown;
}

export type AgentNodeType = Node<AgentNodeData, "agent">;

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */

const iconMap = {
  database: {
    bg: "bg-secondary-container/20",
    icon: <Database className="w-4 h-4 text-primary" />,
  },
  brain: {
    bg: "bg-primary-container/20",
    icon: <Brain className="w-4 h-4 text-primary" />,
  },
  code: {
    bg: "bg-tertiary-container/20",
    icon: <Code className="w-4 h-4 text-error" />,
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function AgentNode({ id, data, selected }: NodeProps<AgentNodeType>) {
  const { bg, icon } = iconMap[data.iconType];
  const isHighlighted = selected || data.isSelected;
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [showAllTools, setShowAllTools] = useState(false);
  const [localIsRunning, setLocalIsRunning] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const updateNodeInternals = useUpdateNodeInternals();
  const { viewMode } = useViewMode();

  const isAgentRunning = data.isAgentRunning !== undefined ? data.isAgentRunning : localIsRunning;
  const prevIsRunningRef = useRef(isAgentRunning);

  useEffect(() => {
    // Only show notification if we went from running to not running
    if (prevIsRunningRef.current === true && isAgentRunning === false) {
      setShowNotification(true);
    }
    prevIsRunningRef.current = isAgentRunning;
  }, [isAgentRunning]);

  useEffect(() => {
    if (isHighlighted && showNotification) {
      setShowNotification(false);
    }
  }, [isHighlighted, showNotification]);

  const toggleTool = (e: React.MouseEvent, toolId: string) => {
    e.stopPropagation();
    setExpandedTools((prev) => ({ ...prev, [toolId]: !prev[toolId] }));
    // Tell React Flow the node dimensions changed so it redraws edges correctly
    setTimeout(() => updateNodeInternals(id), 0);
  };

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent node selection when clicking run
    if (data.isTourMode) return;
    if (isAgentRunning) return;

    if (typeof data.onRunStart === "function") {
      data.onRunStart(id);
    } else {
      // Fallback to simulated behavior for agents not yet connected
      setLocalIsRunning(true);
      setTimeout(() => {
        setLocalIsRunning(false);
        if (typeof data.onRunComplete === "function") {
          data.onRunComplete(id);
        }
      }, 5000);
    }
  };

  return (
    <div
      className={`w-[280px] rounded-xl shadow-2xl flex flex-col transition-colors relative ${
        isHighlighted
          ? "border border-primary-container bg-surface shadow-[0_8px_32px_rgba(208,188,255,0.1)]"
          : "border border-outline-variant bg-surface hover:border-primary-container"
      }`}
    >
      {/* Completion Notification */}
      {showNotification && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-50">
          <div className="bg-primary text-black text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
            Click to view results
          </div>
          <div className="w-2.5 h-2.5 bg-primary rotate-45 -mt-1.5 rounded-sm"></div>
        </div>
      )}
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between p-2 border-b border-surface-container-highest bg-surface-container-low rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded ${bg} flex items-center justify-center`}>
            {icon}
          </div>
          <h3 className="text-[13px] font-semibold leading-[18px] tracking-[0.05em] text-on-surface">
            {data.title}
          </h3>
        </div>
        {data.hasRunButton ? (
          <button 
            onClick={handleRun}
            disabled={isAgentRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.98] cursor-pointer shadow-sm uppercase ${
              isAgentRunning 
                ? "bg-secondary-container/20 text-primary border border-secondary/20 cursor-default" 
                : "bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container shadow-[0_0_12px_rgba(208,188,255,0.2)] hover:shadow-[0_0_16px_rgba(208,188,255,0.4)]"
            }`}
          >
            {isAgentRunning ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Running
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                Run
              </>
            )}
          </button>
        ) : data.statusBadge ? (
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: data.statusBadge.color }}
            />
            <span className="text-xs" style={{ color: data.statusBadge.color }}>
              {data.statusBadge.label}
            </span>
          </div>
        ) : (
          <button className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
            <MoreHorizontal className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>

      {/* ---- Body ---- */}
      <div className="p-4 flex flex-col gap-4">
        {data.description && (
          <p className="text-xs leading-4 text-on-surface-variant">
            {data.description}
          </p>
        )}

        {data.confidenceScore !== undefined && (
          <div className="bg-surface-container rounded-md p-2 border border-outline-variant/50">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-on-surface-variant">
                Confidence Score
              </span>
              <span className="text-[13px] font-semibold tracking-[0.05em] text-primary">
                {data.confidenceScore}%
              </span>
            </div>
            <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${data.confidenceScore}%` }}
              />
            </div>
          </div>
        )}

        {/* Individual Tool Accordions - Only visible in Developer Mode */}
        {(viewMode === "developer" || viewMode === "test") && data.toolCalls && data.toolCalls.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                {showAllTools ? "All Tool Calls" : "Recent Activity"}
              </span>
              {data.toolCalls.length > 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllTools(!showAllTools);
                    setTimeout(() => updateNodeInternals(id), 0);
                  }}
                  className="text-[10px] text-primary hover:text-primary-container transition-colors flex items-center gap-1"
                >
                  {showAllTools ? "Show Less" : `View All (${data.toolCalls.length})`}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAllTools ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
              {(showAllTools ? data.toolCalls : data.toolCalls.slice(-1)).map((tool, index) => {
                const isExpanded = expandedTools[tool.id] || false;
                return (
                  <div key={`${tool.id}-${index}`} className="shrink-0 bg-surface-container border border-outline-variant/30 rounded-lg overflow-hidden cursor-default">
                    {(() => {
                      let displayTitle = tool.name;
                      try {
                        const parsedInputs = typeof tool.inputs === 'string' ? JSON.parse(tool.inputs) : tool.inputs;
                        if (parsedInputs && (parsedInputs.reason || parsedInputs['arguments.reason'])) {
                          displayTitle = parsedInputs.reason || parsedInputs['arguments.reason'];
                        }
                      } catch (e) {
                        // ignore parse errors
                      }
                      return (
                        <button
                          onClick={(e) => toggleTool(e, tool.id)}
                          className="w-full flex items-center gap-2 p-2 text-xs text-on-surface-variant hover:text-on-surface hover:bg-[var(--color-outline)] transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-surface border border-outline-variant/30 flex items-center justify-center shrink-0">
                            <Wrench className="w-3 h-3 text-on-surface-variant" />
                          </div>
                          <span className="flex-1 text-left font-mono truncate" title={displayTitle}>{displayTitle}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })()}
                    
                    {isExpanded && (
                      <div className="p-2 border-t border-outline-variant/30 bg-surface flex flex-col gap-2">
                        <div className="bg-background border border-outline-variant rounded-md p-2 w-full font-mono text-[10px] overflow-x-auto hide-scrollbar flex flex-col gap-2">
                          {/* Parameters */}
                          {tool.inputs && (
                            <div>
                              <div className="inline-block bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded text-[9px] mb-1.5">
                                Parameters
                              </div>
                              <pre className="text-[#9ECE6A] whitespace-pre-wrap break-all">
                                {typeof tool.inputs === 'string' ? tool.inputs : JSON.stringify(tool.inputs, null, 2)}
                              </pre>
                            </div>
                          )}
                          {/* Result */}
                          <div>
                            <div className="inline-block bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded text-[9px] mb-1.5">
                              Result
                            </div>
                            <pre className="text-[#A9B1D6] whitespace-pre-wrap break-all">
                              {tool.output}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Port Labels */}
        <div className="flex justify-between items-center w-full mt-2">
          <span className="text-xs text-on-surface-variant">
            {data.inputLabel}
          </span>
          <span
            className={`text-xs ${
              data.outputVariant === "active" ? "text-primary" : "text-on-surface-variant"
            }`}
          >
            {data.outputLabel}
          </span>
        </div>
      </div>

      {/* ---- Handles (connection ports) ---- */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-3 !h-3 !rounded-full !border !-left-[6px] ${
          data.inputVariant === "active"
            ? "!bg-primary !border-primary !shadow-[0_0_8px_rgba(208,188,255,0.8)]"
            : "!bg-surface !border-outline"
        }`}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={`!w-3 !h-3 !rounded-full !border !-right-[6px] ${
          data.outputVariant === "active"
            ? "!bg-primary !border-primary !shadow-[0_0_8px_rgba(208,188,255,0.8)]"
            : "!bg-surface !border-outline"
        }`}
      />
    </div>
  );
}

export default memo(AgentNode);
