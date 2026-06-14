"use client";

import React, { useState } from 'react';
import { 
  Search, Brain, Shield, Info, Network, Zap, Eye, Workflow, Layers,
  Activity, CheckCircle2, ChevronRight, Settings, Loader2
} from 'lucide-react';

export const ReasoningSimulator = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const [constraints, setConstraints] = useState({
    mode: 'Model Audit',
    labels: 'Ground Truth Available',
    scope: 'Multiple Groups',
  });

  const runDiagnostic = () => {
    setIsSimulating(true);
    setResultReady(false);
    
    // Simple, bulletproof delay for "thinking" effect
    setTimeout(() => {
      setIsSimulating(false);
      setResultReady(true);
    }, 1500);
  };

  const currentResult = {
    title: constraints.mode === 'Model Audit' ? "Post-Inference Calibration" : "Pre-Processing Alignment",
    algos: constraints.labels === 'Ground Truth Available' 
      ? ['Equal Opportunity Calibrator', 'SHAP Proxy Detector', 'Intersectional Scanner']
      : ['Disparate Impact Repair', 'Distance Covariance Scanner', 'Mutual Information Scanner']
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto bg-[#0d0f14] border border-white/10 rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <Brain size={180} className="text-primary" />
      </div>

      <div className="flex flex-col lg:flex-row gap-12 relative z-10">
        {/* Left: Input Console */}
        <div className="flex-1 flex flex-col gap-8">
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-2 text-primary">
                <Shield size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Forensic Console</span>
             </div>
             <h3 className="text-2xl font-display font-black uppercase text-white">Input Parameters</h3>
          </div>

          <div className="space-y-6">
            {[
              { label: 'Audit Mode', key: 'mode', options: ['Dataset Audit', 'Model Audit'] },
              { label: 'Data Labels', key: 'labels', options: ['Ground Truth Available', 'No Ground Truth'] },
              { label: 'Analysis Scope', key: 'scope', options: ['Single Attribute', 'Multiple Groups'] }
            ].map((group) => (
              <div key={group.label} className="flex flex-col gap-3">
                <span className="text-[9px] uppercase font-bold text-white/30 tracking-widest">{group.label}</span>
                <div className="flex flex-wrap gap-2">
                  {group.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setConstraints(prev => ({ ...prev, [group.key]: opt })); setResultReady(false); }}
                      disabled={isSimulating}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                        constraints[group.key as keyof typeof constraints] === opt 
                        ? 'bg-primary border-primary text-black' 
                        : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/20'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={runDiagnostic}
            disabled={isSimulating}
            className="group flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-white text-black font-display font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            {isSimulating ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>GENERATE PIPELINE <ChevronRight size={14} /></>
            )}
          </button>
        </div>

        {/* Right: Output Result */}
        <div className="flex-1 bg-black/40 rounded-3xl border border-white/5 p-8 flex flex-col gap-6 min-h-[300px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
             <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Diagnostic Verdict</span>
             <Activity size={14} className={isSimulating ? "text-primary animate-pulse" : "text-white/10"} />
          </div>

          <div className="flex-1 flex flex-col justify-center items-center text-center gap-6">
            {!isSimulating && !resultReady && (
              <div className="flex flex-col items-center gap-4 opacity-20">
                <Search size={48} />
                <span className="text-xs uppercase font-bold tracking-widest">Awaiting Parameters...</span>
              </div>
            )}

            {isSimulating && (
              <div className="flex flex-col items-center gap-4">
                 <div className="relative w-16 h-16">
                    <Brain size={64} className="text-primary animate-pulse" />
                    <div className="absolute inset-0 border-2 border-primary border-dashed rounded-full animate-spin-slow"></div>
                 </div>
                 <span className="text-[10px] font-mono text-primary animate-pulse uppercase tracking-[0.2em]">Agent Reasoning...</span>
              </div>
            )}

            {resultReady && (
              <div className="w-full flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500 text-left">
                 <div className="flex flex-col gap-1">
                    <span className="text-xs text-primary font-black uppercase tracking-widest">Recommended Strategy</span>
                    <h4 className="text-xl font-display font-black text-white uppercase">{currentResult.title}</h4>
                 </div>

                 <div className="space-y-3">
                   {currentResult.algos.map((algo, i) => (
                     <div key={i} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                        <CheckCircle2 size={14} className="text-primary" />
                        <span className="text-[11px] font-bold text-white uppercase tracking-tight">{algo}</span>
                     </div>
                   ))}
                 </div>

                 <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex gap-3">
                    <Info size={16} className="text-primary shrink-0" />
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">This pipeline is optimized for <span className="text-white font-bold">{constraints.mode}</span> using implementation logic tailored for <span className="text-white font-bold">{constraints.labels}</span>.</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
