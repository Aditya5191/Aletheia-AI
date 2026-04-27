"use client";

import {
  GitBranch,
  FileText,
  HelpCircle,
  Zap,
  Fingerprint,
} from "lucide-react";

import { useViewMode } from "./ViewModeContext";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  comingSoon?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Workflows",
    icon: <GitBranch className="w-5 h-5" />,
    active: true,
  },
  {
    label: "Model Auditor",
    icon: <Fingerprint className="w-5 h-5" />,
    comingSoon: true,
  },
];

export default function SideNavBar() {
  const { isSidebarCollapsed, setShowDocs } = useViewMode();

  return (
    <nav 
      className={`fixed left-0 top-16 bottom-0 flex flex-col py-4 z-[90] bg-[#15171B] border-r border-[#1F2228] text-sm font-medium transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "w-0 -translate-x-full opacity-0 overflow-hidden" : "w-[260px] translate-x-0 opacity-100"
      }`}
    >
      {/* Workspace Header */}
      <div className="px-6 mb-6 mt-2 whitespace-nowrap">
        <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-1">
          Workspace
        </h2>
        <div className="text-lg font-bold text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          AI Production
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col gap-1 px-2 whitespace-nowrap">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              if (item.comingSoon) {
                alert("Model Auditor is coming soon! This feature will enable deep forensic analysis of weights, biases, and drift for deployed models.");
              }
            }}
            className={`w-full flex items-center justify-between px-4 py-3 transition-all duration-200 cursor-pointer ${
              item.active
                ? "bg-violet-500/10 text-violet-400 border-r-4 border-violet-500 shadow-[inset_1px_0_0_0_rgba(139,92,246,0.5)]"
                : "text-gray-500 hover:text-gray-200 hover:bg-[#1F2228]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={item.active ? "text-violet-400" : "text-gray-500"}>
                {item.icon}
              </div>
              <span className="font-bold tracking-tight">{item.label}</span>
            </div>
            {item.comingSoon && (
              <span className="text-[9px] bg-violet-500/10 text-violet-500/60 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter border border-violet-500/20">Soon</span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="px-6 mt-auto whitespace-nowrap">
        <div className="flex flex-col gap-2 pt-4 border-t border-[#1F2228]">
          <button
            onClick={() => setShowDocs(true)}
            className="flex items-center gap-3 text-gray-500 hover:text-gray-300 transition-colors text-xs cursor-pointer w-full"
          >
            <FileText className="w-4 h-4" />
            Docs
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
