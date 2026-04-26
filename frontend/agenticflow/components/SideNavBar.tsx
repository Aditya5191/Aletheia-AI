"use client";

import {
  GitBranch,
  Puzzle,
  Play,
  Settings,
  Plus,
  FileText,
  HelpCircle,
  Zap,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Workflows",
    icon: <GitBranch className="w-5 h-5" />,
    active: true,
  },
  {
    label: "Library",
    icon: <Puzzle className="w-5 h-5" />,
  },
  {
    label: "Executions",
    icon: <Play className="w-5 h-5" />,
  },
  {
    label: "Settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function SideNavBar() {
  return (
    <nav className="fixed left-0 top-16 bottom-0 w-[260px] flex flex-col py-4 z-[90] bg-[#15171B] border-r border-[#1F2228] text-sm font-medium">
      {/* Workspace Header */}
      <div className="px-6 mb-6 mt-2">
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
      <div className="flex-1 flex flex-col gap-1 px-2">
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
              item.active
                ? "bg-violet-500/10 text-violet-400 border-r-4 border-violet-500"
                : "text-gray-500 hover:text-gray-200 hover:bg-[#1F2228]"
            }`}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="px-6 mt-auto">
        <button className="w-full py-2.5 rounded-md border border-[#1F2228] text-gray-300 hover:bg-[#1F2228] hover:text-white transition-colors flex items-center justify-center gap-2 mb-6 shadow-sm cursor-pointer">
          <Plus className="w-4 h-4" />
          Add Node
        </button>
        <div className="flex flex-col gap-2 pt-4 border-t border-[#1F2228]">
          <a
            href="#"
            className="flex items-center gap-3 text-gray-500 hover:text-gray-300 transition-colors text-xs"
          >
            <FileText className="w-4 h-4" />
            Docs
          </a>
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
