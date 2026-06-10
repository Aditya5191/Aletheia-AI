"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  History,
  Bell,
  UserCircle,
  Terminal,
  Eye,
  LogOut,
  User,
  Settings as SettingsIcon,
  CheckCircle,
  Menu,
  FlaskConical,
} from "lucide-react";
import { useViewMode } from "./ViewModeContext";

export default function TopAppBar() {
  const { viewMode, setViewMode, isSidebarCollapsed, setIsSidebarCollapsed } = useViewMode();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-[100] flex justify-between items-center px-6 h-16 bg-background/80 backdrop-blur-md border-b border-outline-variant shadow-2xl shadow-black/50">
      {/* Logo & Toggle */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-2 rounded-lg text-gray-400 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-xl font-black tracking-tighter text-primary uppercase select-none">
          Aletheia
        </span>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-6">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-surface border border-outline-variant rounded-full p-1 shadow-inner">
          <button
            onClick={() => setViewMode("developer")}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
              viewMode === "developer"
                ? "bg-primary text-white shadow-lg shadow-primary/40"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Developer
          </button>
          <button
            onClick={() => setViewMode("test-developer")}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
              viewMode === "test-developer"
                ? "bg-amber-500 text-white shadow-lg shadow-amber-900/40"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Test
          </button>
          <button
            onClick={() => setViewMode("user")}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
              viewMode === "user"
                ? "bg-primary text-white shadow-lg shadow-primary/40"
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
            className="w-full bg-surface border border-outline-variant text-white rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-600"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 border-l border-outline-variant pl-6">
          <button className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer">
            Execute
          </button>
          <button className="px-4 py-1.5 text-sm font-semibold bg-primary hover:bg-primary text-white rounded-md transition-colors shadow-lg shadow-primary/20 cursor-pointer">
            Deploy
          </button>
        </div>

        {/* Icon Buttons */}
        <div className="flex items-center gap-1 border-l border-outline-variant pl-6">
          {/* History Dropdown */}
          <div className="relative" ref={historyRef}>
            <button 
              onClick={() => {
                setShowHistory(!showHistory);
                setShowNotifications(false);
                setShowProfile(false);
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                showHistory ? "bg-primary text-white" : "text-gray-400 hover:bg-primary/10 hover:text-primary"
              }`}
            >
              <History className="w-5 h-5" />
            </button>
            
            {showHistory && (
              <div className="absolute right-0 mt-3 w-72 bg-surface border border-outline-variant rounded-xl shadow-2xl shadow-black/80 py-2 z-[110] animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-2 border-b border-outline-variant mb-1">
                  <span className="font-bold text-white text-sm">Recent Activity</span>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  <div className="px-4 py-2.5 hover:bg-surface-container transition-colors cursor-pointer group border-l-2 border-transparent hover:border-primary">
                    <p className="text-[13px] text-gray-200 font-medium">Adult_Census_Audit.v1</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">2 hours ago • Fairness Score: 84</p>
                  </div>
                  <div className="px-4 py-2.5 hover:bg-surface-container transition-colors cursor-pointer group border-l-2 border-transparent hover:border-primary">
                    <p className="text-[13px] text-gray-200 font-medium">Loan_Approval_Pipeline</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Yesterday • Fairness Score: 91</p>
                  </div>
                  <div className="px-4 py-2.5 hover:bg-surface-container transition-colors cursor-pointer group border-l-2 border-transparent hover:border-primary">
                    <p className="text-[13px] text-gray-200 font-medium">Recidivism_Risk_Analysis</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Oct 24, 2023 • Fairness Score: 78</p>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-outline-variant mt-1 text-center">
                  <button className="text-[11px] text-gray-500 font-bold hover:text-gray-300 transition-colors uppercase tracking-wider">
                    Clear History
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
                setShowHistory(false);
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                showNotifications ? "bg-primary text-white" : "text-gray-400 hover:bg-primary/10 hover:text-primary"
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 border border-[var(--color-background)] rounded-full"></span>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-surface border border-outline-variant rounded-xl shadow-2xl shadow-black/80 py-2 z-[110] animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-2 border-b border-outline-variant flex justify-between items-center mb-1">
                  <span className="font-bold text-white">Notifications</span>
                  <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">2 New</span>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  <div className="px-4 py-3 hover:bg-surface-container transition-colors cursor-pointer group">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-200 leading-tight">Fairness Audit Complete</p>
                        <p className="text-[11px] text-gray-500 mt-1">Adult_Dataset_Clean.csv processed successfully.</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 hover:bg-surface-container transition-colors cursor-pointer group">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Terminal className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-200 leading-tight">New Sandbox Initialized</p>
                        <p className="text-[11px] text-gray-500 mt-1">Docker environment ready for execution.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-outline-variant mt-1 text-center">
                  <button className="text-[11px] text-primary font-bold hover:text-primary transition-colors uppercase tracking-wider">
                    View All Activity
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
                setShowHistory(false);
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                showProfile ? "bg-primary text-white" : "text-gray-400 hover:bg-primary/10 hover:text-primary"
              }`}
            >
              <UserCircle className="w-5 h-5" />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-3 w-56 bg-surface border border-outline-variant rounded-xl shadow-2xl shadow-black/80 py-2 z-[110] animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-3 border-b border-outline-variant mb-1">
                  <p className="text-sm font-bold text-white">Rushil</p>
                  <p className="text-xs text-gray-500 truncate">rushil@agenticflow.ai</p>
                </div>
                <div className="px-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-primary/10 transition-all text-sm group">
                    <User className="w-4 h-4 group-hover:text-primary" />
                    My Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-primary/10 transition-all text-sm group">
                    <SettingsIcon className="w-4 h-4 group-hover:text-primary" />
                    Account Settings
                  </button>
                </div>
                <div className="mt-1 pt-1 border-t border-outline-variant px-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all text-sm font-medium">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
