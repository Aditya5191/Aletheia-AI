"use client";

import {
  Search,
  History,
  Bell,
  UserCircle,
  Terminal,
  Eye,
} from "lucide-react";
import { useViewMode } from "./ViewModeContext";

export default function TopAppBar() {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <header className="fixed top-0 left-0 w-full z-[100] flex justify-between items-center px-6 h-16 bg-[#0B0D10]/80 backdrop-blur-md border-b border-[#1F2228] shadow-2xl shadow-black/50">
      {/* Logo */}
      <div className="flex items-center gap-6">
        <span className="text-xl font-black tracking-tighter text-violet-500 uppercase select-none">
          AgenticFlow
        </span>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-6">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#15171B] border border-[#1F2228] rounded-full p-1 shadow-inner">
          <button
            onClick={() => setViewMode("developer")}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
              viewMode === "developer"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Developer
          </button>
          <button
            onClick={() => setViewMode("user")}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
              viewMode === "user"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            User
          </button>
        </div>

        {/* Search */}
        <div className="relative w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search components..."
            className="w-full bg-[#15171B] border border-[#1F2228] text-white rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-gray-600"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 border-l border-[#1F2228] pl-6">
          <button className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer">
            Execute
          </button>
          <button className="px-4 py-1.5 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-md transition-colors shadow-lg shadow-violet-900/20 cursor-pointer">
            Deploy
          </button>
        </div>

        {/* Icon Buttons */}
        <div className="flex items-center gap-1 border-l border-[#1F2228] pl-6">
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-violet-500/10 hover:text-violet-300 transition-colors cursor-pointer">
            <History className="w-5 h-5" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-violet-500/10 hover:text-violet-300 transition-colors cursor-pointer">
            <Bell className="w-5 h-5" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-violet-500/10 hover:text-violet-300 transition-colors cursor-pointer">
            <UserCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
