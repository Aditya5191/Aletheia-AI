"use client";

import { useState, useRef, useCallback } from "react";
import { WS_BASE_URL } from "../lib/config";

export interface ToolCallRecord {
  id: string;
  name: string;
  inputs: string;
  output: string;
  status: "pending" | "completed";
}

export interface AgentState {
  status: "idle" | "running" | "completed" | "error";
  toolCalls: ToolCallRecord[];
  finalResponse?: string;
}

export interface AuditEvent {
  type: "status" | "agent_start" | "tool_call" | "tool_result" | "agent_response" | "error" | "complete";
  agent?: string;
  tool_name?: string;
  tool_id?: string;
  inputs?: Record<string, any>;
  output?: string;
  content?: string;
  message?: string;
}

const WS_URL = `${WS_BASE_URL}/ws/audit`;

export function useAuditSocket() {
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [agents, setAgents] = useState<Record<string, AgentState>>({
    "data_surveyor": { status: "idle", toolCalls: [] },
    "fairness_adjudicator": { status: "idle", toolCalls: [] },
    "mitigation_agent": { status: "idle", toolCalls: [] }
  });
  const [statusMessage, setStatusMessage] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current) return;

    setConnectionStatus("connecting");
    setStatusMessage("Opening connection to Aletheia...");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("connected");
      setStatusMessage("Connected. Waiting for agent events...");
    };

    ws.onerror = () => {
      setConnectionStatus("error");
      setStatusMessage("WebSocket error. Ensure backend is running on 8005.");
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      wsRef.current = null;
    };

    ws.onmessage = (event) => {
      try {
        const data: AuditEvent = JSON.parse(event.data);
        console.log("WS Event:", data);

        switch (data.type) {
          case "status":
            setStatusMessage(data.message || "");
            break;
          case "agent_start":
            if (data.agent) {
              setAgents(prev => ({
                ...prev,
                [data.agent!]: { ...prev[data.agent!], status: "running" }
              }));
            }
            break;
          case "tool_call":
            if (data.agent) {
              setAgents(prev => ({
                ...prev,
                [data.agent!]: {
                  ...prev[data.agent!],
                  toolCalls: [
                    ...prev[data.agent!].toolCalls,
                    {
                      id: data.tool_id || `tc-${Date.now()}`,
                      name: data.tool_name || "tool",
                      inputs: typeof data.inputs === "string" ? data.inputs : JSON.stringify(data.inputs, null, 2),
                      output: "⏳ Processing...",
                      status: "pending"
                    }
                  ]
                }
              }));
            }
            break;
          case "tool_result":
            if (data.agent) {
              setAgents(prev => ({
                ...prev,
                [data.agent!]: {
                  ...prev[data.agent!],
                  toolCalls: prev[data.agent!].toolCalls.map(tc => 
                    tc.id === data.tool_id ? { ...tc, output: data.output || "(no output)", status: "completed" } : tc
                  )
                }
              }));
            }
            break;
          case "agent_response":
            if (data.agent) {
              setAgents(prev => ({
                ...prev,
                [data.agent!]: { ...prev[data.agent!], status: "completed", finalResponse: data.content }
              }));
            }
            break;
          case "complete":
            setStatusMessage("Audit Complete.");
            break;
          case "error":
            setStatusMessage(`Error: ${data.message}`);
            break;
        }
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  return { connect, disconnect, connectionStatus, agents, statusMessage };
}
