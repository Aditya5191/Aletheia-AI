"use client";

import React from "react";
import { X, Book, Shield, Zap, Terminal, FileText, ChevronRight } from "lucide-react";

interface DocsModalProps {
  onClose: () => void;
}

export default function DocsModal({ onClose }: DocsModalProps) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-4xl max-h-[85vh] bg-background border border-outline-variant rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <Book className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">Aletheia Documentation</h2>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-black">Fairness Auditing Framework</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* Quick Start */}
          <section className="mb-12">
            <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Quick Start Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface border border-outline-variant hover:border-violet-500/30 transition-colors group">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white font-bold text-sm shrink-0">1</div>
                  <div>
                    <p className="text-white font-semibold mb-1">Upload Data</p>
                    <p className="text-xs text-gray-500 leading-relaxed">Drag your CSV onto the "Dataset Input" node. Ensure protected attributes like gender or age are present.</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-outline-variant hover:border-violet-500/30 transition-colors">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white font-bold text-sm shrink-0">2</div>
                  <div>
                    <p className="text-white font-semibold mb-1">Run Inspection</p>
                    <p className="text-xs text-gray-500 leading-relaxed">Click "RUN" on the Data Inspector. Aletheia will spawn a secure Docker sandbox to profile the data.</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-outline-variant hover:border-violet-500/30 transition-colors">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white font-bold text-sm shrink-0">3</div>
                  <div>
                    <p className="text-white font-semibold mb-1">Audit Biases</p>
                    <p className="text-xs text-gray-500 leading-relaxed">Agent Auditor will select the best fairness algorithm. Watch for red paths indicating detected disparities.</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-outline-variant hover:border-violet-500/30 transition-colors">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white font-bold text-sm shrink-0">4</div>
                  <div>
                    <p className="text-white font-semibold mb-1">Export Report</p>
                    <p className="text-xs text-gray-500 leading-relaxed">The Mitigation Expert repairs data, and the Report Writer compiles a publication-ready PDF.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Core Concepts */}
          <section className="mb-12">
            <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Core Concepts
            </h3>
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-surface border border-outline-variant">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-white font-semibold">The 80% Rule (Disparate Impact)</p>
                  <span className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded font-bold">LEGAL STANDARD</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  A selection rate for any group which is less than four-fifths (80%) of the rate for the group with the highest rate will generally be regarded as evidence of adverse impact.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-surface border border-outline-variant">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-white font-semibold">Dockerized Sandbox Isolation</p>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">SECURITY</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  All AI-generated code executes in an ephemeral Docker container. No local dependencies are required, and your host system remains isolated from agent execution.
                </p>
              </div>
            </div>
          </section>

          {/* Technical Reference */}
          <section>
            <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Technical Reference
            </h3>
            <div className="rounded-xl border border-outline-variant divide-y divide-[var(--color-outline-variant)]">
              <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <p className="text-sm text-gray-300">MCP Tool Definitions</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-violet-500" />
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <p className="text-sm text-gray-300">Algorithm Metadata Schemas</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-violet-500" />
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <p className="text-sm text-gray-300">WebSocket Event Protocol</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-violet-500" />
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <p className="text-sm text-gray-300">Fairness Metric Mathematical Proofs</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-violet-500" />
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant bg-surface flex justify-between items-center text-[11px] text-gray-600">
          <p>© 2026 Aletheia AI Framework v1.0</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-violet-400">Privacy Policy</a>
            <a href="#" className="hover:text-violet-400">Github</a>
          </div>
        </div>
      </div>
    </div>
  );
}
