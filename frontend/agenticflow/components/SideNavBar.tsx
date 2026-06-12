"use client";

import {
  GitBranch,
  FileText,
  HelpCircle,
  Zap,
  Fingerprint,
  Compass,
} from "lucide-react";

import { useViewMode } from "./ViewModeContext";

export default function SideNavBar() {
  const { isSidebarCollapsed, setShowTour, currentView, setCurrentView } = useViewMode();

  return (
    <nav
      className={`fixed left-0 top-16 bottom-0 flex flex-col py-4 z-[90] bg-surface border-r border-outline-variant text-sm font-medium transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "w-0 -translate-x-full opacity-0 overflow-hidden" : "w-[260px] translate-x-0 opacity-100"
      }`}
    >
      {/* Workspace Header */}
      <div className="px-6 mb-6 mt-2 whitespace-nowrap">
        <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-1">
          Workspace
        </h2>
        <div className="text-lg font-bold text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          AI Production
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col gap-1 px-2 whitespace-nowrap">
        <button
          onClick={() => setCurrentView("dataset")}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer ${
            currentView === "dataset"
              ? "bg-primary/10 text-primary border-r-4 border-primary shadow-[inset_1px_0_0_0_rgba(139,92,246,0.5)]"
              : "text-gray-500 hover:text-gray-200 hover:bg-surface-container"
          }`}
        >
          <GitBranch className={`w-5 h-5 ${currentView === "dataset" ? "text-primary" : "text-gray-500"}`} />
          <span className="font-bold tracking-tight">Workflows</span>
        </button>

        <button
          onClick={() => setCurrentView("model")}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer ${
            currentView === "model"
              ? "bg-secondary/10 text-secondary border-r-4 border-secondary shadow-[inset_1px_0_0_0_rgba(100,200,255,0.3)]"
              : "text-gray-500 hover:text-gray-200 hover:bg-surface-container"
          }`}
        >
          <Fingerprint className={`w-5 h-5 ${currentView === "model" ? "text-secondary" : "text-gray-500"}`} />
          <span className="font-bold tracking-tight">Model Auditor</span>
        </button>
      </div>

      {/* Bottom Section */}
      <div className="px-6 mt-auto whitespace-nowrap">
        <div className="flex flex-col gap-2 pt-4 border-t border-outline-variant">
          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-3 text-gray-500 hover:text-gray-300 transition-colors text-xs cursor-pointer w-full"
          >
            <Compass className="w-4 h-4" />
            Tour
          </button>
          <a
            href="#"
            className="flex items-center gap-3 text-gray-500 hover:text-gray-300 transition-colors text-xs"
          >
            <HelpCircle className="w-4 h-4" />
            Support
          </a>
        </div>
      </div>
    </nav>
  );
}
