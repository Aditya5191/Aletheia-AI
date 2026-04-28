"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type ViewMode = "developer" | "user";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  showDocs: boolean;
  setShowDocs: (show: boolean) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("developer");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  return (
    <ViewModeContext.Provider value={{ 
      viewMode, 
      setViewMode, 
      isSidebarCollapsed, 
      setIsSidebarCollapsed,
      showDocs,
      setShowDocs
    }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}
