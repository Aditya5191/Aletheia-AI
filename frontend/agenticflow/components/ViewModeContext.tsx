"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type ViewMode = "developer" | "user" | "test-developer";
export type CurrentView = "dataset" | "model" | "biasprobe" | "library";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentView: CurrentView;
  setCurrentView: (view: CurrentView) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  showDocs: boolean;
  setShowDocs: (show: boolean) => void;
  showTour: boolean;
  setShowTour: (show: boolean) => void;
  // Tour-driven modal control
  tourNodeId: string | null;
  setTourNodeId: (id: string | null) => void;
  tourTab: "chart" | "review" | "code" | null;
  setTourTab: (tab: "chart" | "review" | "code" | null) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("developer");
  const [currentView, setCurrentView] = useState<CurrentView>("dataset");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourNodeId, setTourNodeId] = useState<string | null>(null);
  const [tourTab, setTourTab] = useState<"chart" | "review" | "code" | null>(null);

  return (
    <ViewModeContext.Provider value={{
      viewMode,
      setViewMode,
      currentView,
      setCurrentView,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      showDocs,
      setShowDocs,
      showTour,
      setShowTour,
      tourNodeId,
      setTourNodeId,
      tourTab,
      setTourTab
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
