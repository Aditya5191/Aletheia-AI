"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Loader2, AlertCircle } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DockerStatus = "idle" | "spawning" | "running" | "stopped" | "error";

export interface DockerNodeData {
  status: DockerStatus;
  containerId?: string;
  [key: string]: unknown;
}

export type DockerNodeType = Node<DockerNodeData, "docker">;

/* ------------------------------------------------------------------ */
/*  Status config                                                      */
/* ------------------------------------------------------------------ */

const statusConfig: Record<DockerStatus, { label: string; color: string; bgRing: string; pulseColor: string }> = {
  idle: {
    label: "Waiting",
    color: "#565F89",
    bgRing: "rgba(86, 95, 137, 0.15)",
    pulseColor: "rgba(86, 95, 137, 0.3)",
  },
  spawning: {
    label: "Spawning",
    color: "#7AA2F7",
    bgRing: "rgba(122, 162, 247, 0.15)",
    pulseColor: "rgba(122, 162, 247, 0.4)",
  },
  running: {
    label: "Running",
    color: "#4edea3",
    bgRing: "rgba(78, 222, 163, 0.15)",
    pulseColor: "rgba(78, 222, 163, 0.4)",
  },
  stopped: {
    label: "Stopped",
    color: "#565F89",
    bgRing: "rgba(86, 95, 137, 0.15)",
    pulseColor: "rgba(86, 95, 137, 0.2)",
  },
  error: {
    label: "Error",
    color: "#f7768e",
    bgRing: "rgba(247, 118, 142, 0.15)",
    pulseColor: "rgba(247, 118, 142, 0.4)",
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function renderCenterIcon(status: DockerStatus, color: string, isDimmed: boolean) {
  if (status === "spawning") {
    return <Loader2 className="w-5 h-5 animate-spin" style={{ color }} />;
  }
  if (status === "error") {
    return <AlertCircle className="w-5 h-5" style={{ color }} />;
  }
  return (
    <img
      src="https://cdn.simpleicons.org/docker/2496ED"
      alt="Docker Logo"
      className="w-5 h-5 object-contain"
      style={{
        opacity: isDimmed ? 0.5 : 1,
        filter: isDimmed ? "grayscale(100%)" : "none",
        transform: "translateX(1px) scale(1.1)",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function DockerNode({ data }: NodeProps<DockerNodeType>) {
  const status = data.status || "idle";
  const cfg = statusConfig[status];
  const isAnimating = status === "spawning";
  const isRunning = status === "running";
  const isDimmed = status === "idle" || status === "stopped";

  return (
    <div className="relative w-[180px]">
      {/* Card */}
      <div
        className="rounded-2xl border overflow-hidden transition-all duration-500"
        style={{
          backgroundColor: "#15171B",
          borderColor: isAnimating || isRunning ? cfg.color + "40" : "#1F2228",
          boxShadow: isAnimating
            ? `0 0 24px ${cfg.pulseColor}, 0 0 48px ${cfg.pulseColor}`
            : isRunning
            ? `0 0 16px ${cfg.pulseColor}`
            : "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Icon area */}
        <div className="flex flex-col items-center pt-5 pb-3 px-4">
          {/* Animated ring */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* Outer pulse ring (spawning only) */}
            {isAnimating && (
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ backgroundColor: cfg.pulseColor, opacity: 0.3 }}
              />
            )}
            {/* Ring */}
            <div
              className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
                isAnimating ? "animate-spin" : ""
              }`}
              style={{
                borderColor: isAnimating ? "transparent" : cfg.color + "30",
                borderTopColor: cfg.color,
                animationDuration: isAnimating ? "1.2s" : undefined,
              }}
            />
            {/* Inner circle */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500"
              style={{ backgroundColor: cfg.bgRing }}
            >
              {renderCenterIcon(status, cfg.color, isDimmed)}
            </div>
          </div>

          {/* Node Title */}
          <p className="text-[12px] font-bold text-on-surface mt-3 tracking-wide">
            Docker Sandbox
          </p>

          {/* Status badge */}
          <div
            className="mt-2 px-3 py-1 rounded-full flex items-center gap-1.5 transition-all duration-300"
            style={{ backgroundColor: cfg.color + "15" }}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${isRunning || isAnimating ? "animate-pulse" : ""}`}
              style={{ backgroundColor: cfg.color }}
            />
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>

          {/* Container ID */}
          {data.containerId && (isRunning || status === "stopped") && (
            <p className="text-[9px] text-outline font-mono mt-2 opacity-60">
              {data.containerId}
            </p>
          )}
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-surface !border-2 !border-outline !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-surface !border-2 !border-outline !-right-1.5"
      />
    </div>
  );
}

export default memo(DockerNode);
