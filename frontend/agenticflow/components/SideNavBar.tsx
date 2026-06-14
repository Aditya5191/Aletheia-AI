"use client";

import {
  GitBranch,
  FileText,
  HelpCircle,
  Zap,
  Fingerprint,
  Compass,
  Library,
  Shield,
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
          className={`w-full flex items-center gap-3 px-4 py-3 transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] cursor-pointer ${
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
          className={`w-full flex items-center gap-3 px-4 py-3 transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] cursor-pointer ${
            currentView === "model"
              ? "bg-secondary/10 text-secondary border-r-4 border-secondary shadow-[inset_1px_0_0_0_rgba(100,200,255,0.3)]"
              : "text-gray-500 hover:text-gray-200 hover:bg-surface-container"
          }`}
        >
          <Fingerprint className={`w-5 h-5 ${currentView === "model" ? "text-secondary" : "text-gray-500"}`} />
          <span className="font-bold tracking-tight">Model Auditor</span>
        </button>

        <button
          onClick={() => setCurrentView("library")}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] cursor-pointer ${
            currentView === "library"
              ? "bg-emerald-500/10 text-emerald-400 border-r-4 border-emerald-500 shadow-[inset_1px_0_0_0_rgba(16,185,129,0.3)]"
              : "text-gray-500 hover:text-gray-200 hover:bg-surface-container"
          }`}
        >
          <Library className={`w-5 h-5 ${currentView === "library" ? "text-emerald-400" : "text-gray-500"}`} />
          <span className="font-bold tracking-tight">Algorithm Library</span>
        </button>

        <a
          href="/privacy"
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-200 hover:bg-surface-container transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.98]"
        >
          <Shield className="w-5 h-5" />
          <span className="font-bold tracking-tight">Privacy Center</span>
        </a>
      </div>

      {/* Bottom Section */}
      <div className="px-6 mt-auto whitespace-nowrap">
        <div className="flex flex-col gap-2 pt-4 border-t border-outline-variant">

          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-3 px-2 py-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-surface-container transition-all duration-150 ease-out active:scale-[0.98] text-xs font-semibold cursor-pointer w-full"
          >
            <Compass className="w-4 h-4" />
            Tour
          </button>
          <a
            href="#"
            className="flex items-center gap-3 px-2 py-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-surface-container transition-all duration-150 ease-out active:scale-[0.98] text-xs font-semibold"
          >
            <HelpCircle className="w-4 h-4" />
            Support
          </a>
        </div>
      </div>
    </nav>
  );
}
