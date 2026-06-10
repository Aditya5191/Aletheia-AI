"use client";

import React from "react";
import { useReactFlow } from "@xyflow/react";
import { Plus, Minus, Maximize, Lock, Unlock } from "lucide-react";

interface CanvasControlsProps {
  isLocked?: boolean;
  onToggleLock?: () => void;
}

export default function CanvasControls({ isLocked, onToggleLock }: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-8 left-8 z-50 flex flex-col gap-2 bg-surface/80 backdrop-blur-xl border border-outline-variant p-1.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <button
        onClick={() => zoomIn()}
        className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-primary/20 hover:text-primary transition-all active:scale-90 group relative"
        title="Zoom In"
      >
        <Plus className="w-5 h-5" />
        <span className="absolute left-full ml-3 px-2 py-1 bg-surface border border-outline-variant text-[10px] text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Zoom In (+)
        </span>
      </button>

      <div className="h-px bg-surface-container mx-2" />

      <button
        onClick={() => zoomOut()}
        className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-primary/20 hover:text-primary transition-all active:scale-90 group relative"
        title="Zoom Out"
      >
        <Minus className="w-5 h-5" />
        <span className="absolute left-full ml-3 px-2 py-1 bg-surface border border-outline-variant text-[10px] text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Zoom Out (-)
        </span>
      </button>

      <div className="h-px bg-surface-container mx-2" />

      <button
        onClick={() => fitView({ duration: 800 })}
        className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-primary/20 hover:text-primary transition-all active:scale-90 group relative"
        title="Fit View"
      >
        <Maximize className="w-4 h-4" />
        <span className="absolute left-full ml-3 px-2 py-1 bg-surface border border-outline-variant text-[10px] text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Fit View (F)
        </span>
      </button>

      {onToggleLock && (
        <>
          <div className="h-px bg-surface-container mx-2" />
          <button
            onClick={onToggleLock}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 group relative ${
              isLocked 
                ? "text-orange-400 bg-orange-400/10 hover:bg-orange-400/20" 
                : "text-gray-400 hover:bg-primary/20 hover:text-primary"
            }`}
            title={isLocked ? "Unlock Canvas" : "Lock Canvas"}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span className="absolute left-full ml-3 px-2 py-1 bg-surface border border-outline-variant text-[10px] text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {isLocked ? "Unlock Nodes" : "Lock Nodes"}
            </span>
          </button>
        </>
      )}
    </div>
  );
}
