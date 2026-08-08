"use client";

import React, { useState, useEffect } from 'react';
import { Shield, ChevronRight, Loader2, TerminalSquare } from 'lucide-react';

export const ReasoningSimulator = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [constraints, setConstraints] = useState({
    mode: 'Model Audit',
    labels: 'Ground Truth Available',
    scope: 'Multiple Groups',
  });

  const runDiagnostic = () => {
    setIsSimulating(true);
    setResultReady(false);
    setLogs([]);
    
    const simulationLogs = [
      "> INITIATING ALETHEIA PROTOCOL...",
      "> ALLOCATING AGENT SWARM [SURVEYOR, ADJUDICATOR]...",
      "> INGESTING DATASET (1,024,491 rows)...",
      "> SCANNING FOR BASE RATE DISPARITIES...",
      `> DETECTED CONFIG: ${constraints.mode.toUpperCase()} | ${constraints.labels.toUpperCase()}`,
      "> OPTIMIZING GRAPH EXECUTION PATH...",
      "> COMPILING AUDIT ARTIFACTS..."
    ];

    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < simulationLogs.length) {
        setLogs(prev => [...prev, simulationLogs[currentLog]]);
        currentLog++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsSimulating(false);
          setResultReady(true);
        }, 300);
      }
    }, 250); // Fast stream
  };

  const currentResult = {
    title: constraints.mode === 'Model Audit' ? "POST-INFERENCE_CALIBRATION" : "PRE-PROCESSING_ALIGNMENT",
    algos: constraints.labels === 'Ground Truth Available' 
      ? ['Equal_Opportunity_Calibrator', 'SHAP_Proxy_Detector', 'Intersectional_Scanner']
      : ['Disparate_Impact_Repair', 'Distance_Covariance_Scanner', 'Mutual_Information_Scanner']
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto bg-[#0a0a0a] border border-white/20 rounded-md shadow-2xl overflow-hidden font-mono text-xs">
      {/* IDE Header */}
      <div className="flex items-center px-4 py-2 border-b border-white/10 bg-[#121212]">
        <div className="flex gap-1.5 mr-4">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
        </div>
        <div className="text-white/40 flex gap-4">
           <span>aletheia_console.sh</span>
           <span>—</span>
           <span className="text-primary/70 flex items-center gap-2"><Shield size={10} /> ROOT_ACCESS</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[500px]">
        {/* Left: Configuration Pane */}
        <div className="lg:w-1/3 border-r border-white/10 p-6 flex flex-col justify-between bg-[#0f0f0f]">
          <div className="space-y-8">
            <div className="text-primary font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
              <TerminalSquare size={14} />
              Config_Parameters
            </div>

            <div className="space-y-6">
              {[
                { label: 'AUDIT_MODE', key: 'mode', options: ['Dataset Audit', 'Model Audit'] },
                { label: 'DATA_LABELS', key: 'labels', options: ['Ground Truth Available', 'No Ground Truth'] },
                { label: 'ANALYSIS_SCOPE', key: 'scope', options: ['Single Attribute', 'Multiple Groups'] }
              ].map((group) => (
                <div key={group.label} className="flex flex-col gap-2">
                  <span className="text-white/40 uppercase">{group.label}</span>
                  <div className="flex flex-col gap-1">
                    {group.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setConstraints(prev => ({ ...prev, [group.key]: opt })); setResultReady(false); setLogs([]); }}
                        disabled={isSimulating}
                        className={`text-left px-3 py-1.5 transition-colors border-l-2 ${
                          constraints[group.key as keyof typeof constraints] === opt 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-transparent text-white/50 hover:bg-white/5 hover:text-white/80'
                        }`}
                      >
                        {constraints[group.key as keyof typeof constraints] === opt ? '[x]' : '[ ]'} {opt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={runDiagnostic}
            disabled={isSimulating}
            className="group flex items-center justify-between w-full p-4 border border-primary/30 bg-primary/10 text-primary font-bold uppercase transition-all hover:bg-primary/20 hover:border-primary disabled:opacity-50"
          >
            {isSimulating ? (
              <span className="flex items-center gap-2 animate-pulse">EXECUTING...</span>
            ) : (
              <span>./EXECUTE_PIPELINE</span>
            )}
            {isSimulating ? <Loader2 className="animate-spin" size={14} /> : <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>

        {/* Right: Terminal Output Pane */}
        <div className="lg:w-2/3 p-6 bg-[#050505] overflow-y-auto">
          {!isSimulating && !resultReady && (
             <div className="text-white/20 flex flex-col gap-2 h-full">
               <span>aletheia@system:~$ awaiting instructions...</span>
               <span className="animate-pulse">_</span>
             </div>
          )}

          {isSimulating && (
             <div className="text-white/70 flex flex-col gap-2">
                {logs.map((log, i) => (
                  <span key={i} className={log.includes('DETECTED CONFIG') ? "text-primary font-bold" : ""}>{log}</span>
                ))}
                <span className="animate-pulse">_</span>
             </div>
          )}

          {resultReady && (
            <div className="text-white/80 flex flex-col gap-4 animate-in fade-in duration-300">
               <div className="text-green-400">
                 {"> EXECUTION COMPLETE. AUDIT PIPELINE GENERATED."}
               </div>
               
               <div className="mt-4 p-4 border border-white/10 bg-white/5 rounded-sm">
                 <div className="text-primary mb-2">{"{"}</div>
                 <div className="pl-4 space-y-2">
                   <div>
                     <span className="text-white/40">"strategy":</span> <span className="text-yellow-200">"{currentResult.title}"</span>,
                   </div>
                   <div>
                     <span className="text-white/40">"active_algorithms":</span> [
                     <div className="pl-4 flex flex-col gap-1 mt-1">
                       {currentResult.algos.map((algo, i) => (
                         <span key={i} className="text-green-300">"{algo}"{i < currentResult.algos.length - 1 ? "," : ""}</span>
                       ))}
                     </div>
                     ],
                   </div>
                   <div>
                     <span className="text-white/40">"status":</span> <span className="text-blue-300">"READY_FOR_DEPLOYMENT"</span>
                   </div>
                 </div>
                 <div className="text-primary mt-2">{"}"}</div>
               </div>

               <div className="text-white/40 mt-4">
                 aletheia@system:~$ _
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
