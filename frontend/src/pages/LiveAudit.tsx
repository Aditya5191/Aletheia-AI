import React, { useEffect, useState, useRef } from 'react';
import { Check, Loader2, Cpu, Activity, XCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createAuditSocket } from '../services/api';
import type { AuditEvent } from '../services/api';

const LogEntry: React.FC<{ time: string; text: string; type?: 'info' | 'thought' | 'tool' | 'success' | 'error' }> = ({ time, text, type = 'info' }) => {
  const colorClass = {
    info: 'text-on-surface-variant',
    thought: 'text-primary brightness-125',
    tool: 'text-secondary/80',
    success: 'text-primary font-bold',
    error: 'text-secondary font-bold'
  }[type];

  return (
    <div className="flex gap-4 font-mono text-[11px] leading-relaxed animate-in fade-in slide-in-from-left-2 duration-300">
      <span className="text-on-surface-variant/30 shrink-0 select-none">[{time}]</span>
      <span className={colorClass}>
        {type === 'thought' && <span className="mr-2">💭</span>}
        {type === 'tool' && <span className="mr-2">⚙</span>}
        {text}
      </span>
    </div>
  );
};

export const LiveAudit: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLog] = useState<{time: string, text: string, type: any}[]>([]);
  const [status, setStatus] = useState("Initializing forensic sandbox...");
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string, type: any = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLog(prev => [...prev, { time, text, type }]);
  };

  useEffect(() => {
    const socket = createAuditSocket((event: AuditEvent) => {
      console.log("Audit Event:", event);

      if (event.type === 'status') {
        setStatus(event.message || "");
        if (event.message?.includes("initiating")) setProgress(10);
        if (event.message?.includes("complete")) {
           setIsComplete(true);
           setProgress(100);
           // Auto-navigate after a short delay so the user can see it finished
           setTimeout(() => {
             navigate('/dashboard');
           }, 3000);
        }
      } else if (event.type === 'thought') {
        addLog(event.content || "", 'thought');
        // Simple heuristic to move progress bar
        setProgress(prev => Math.min(prev + 5, 90));
      } else if (event.type === 'tool_result') {
        const preview = event.content?.substring(0, 100) + "...";
        addLog(`Tool [${event.tool_name}] output: ${preview}`, 'tool');
      } else if (event.type === 'response') {
        addLog(event.content || "", 'success');
      } else if (event.type === 'error') {
        addLog(event.message || "Unknown error", 'error');
      }
    });

    return () => socket.close();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex-1 h-screen flex flex-col bg-transparent relative overflow-hidden">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-outline-variant/10 bg-surface-container/30 backdrop-blur-md z-20">
        <div className="flex items-center gap-12">
          <h1 className="text-xl font-display font-bold text-primary uppercase tracking-wider">Aletheia AI</h1>
          <nav className="flex gap-8">
            {['Overview', 'Audits', 'Models', 'Reports'].map((item) => (
              <button key={item} className={`text-[10px] uppercase font-bold tracking-[0.2em] ${item === 'Audits' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-surface-high flex items-center justify-center text-on-surface-variant">
            <Activity size={14} />
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-high overflow-hidden border border-outline-variant/20">
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">OP</div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-outline-variant/5 bg-surface-lowest/50 flex flex-col p-6 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 bg-surface-highest/30 rounded-md border border-outline-variant/10">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                <Cpu size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-display font-bold uppercase tracking-widest text-on-surface">Active Probe</span>
                <span className="text-[8px] text-on-surface-variant font-mono uppercase tracking-tighter italic">Lustitia-Core-v1</span>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-4 opacity-50 pointer-events-none">
            {['Dashboard', 'Bias Forensic', 'Clinical Logs', 'Audit History'].map((item) => (
              <button key={item} className={`flex items-center gap-3 text-[10px] uppercase font-label font-bold tracking-widest ${item === 'Dashboard' ? 'text-primary' : 'text-on-surface-variant'}`}>
                <div className={`w-1 h-1 rounded-full ${item === 'Dashboard' ? 'bg-primary' : 'bg-transparent'}`}></div>
                {item}
              </button>
            ))}
          </nav>

          <button 
            onClick={() => navigate('/')}
            className="mt-auto flex items-center gap-2 text-[9px] text-on-surface-variant uppercase tracking-widest font-bold hover:text-secondary transition-colors"
          >
            <XCircle size={12} />
            Stop Session
          </button>
        </aside>

        {/* Main Split */}
        <main className="flex-1 flex overflow-hidden">
          {/* Progress Column */}
          <section className="w-96 flex flex-col p-10 border-r border-outline-variant/5 bg-surface-low/20">
            <div className="flex flex-col gap-1 mb-10">
              <span className="text-[10px] text-primary uppercase tracking-[0.4em] font-label font-bold">Audit Live Stream</span>
              <h2 className="text-4xl font-display font-bold text-on-surface uppercase tracking-tight leading-none">Process Graph</h2>
            </div>

            <div className="flex flex-col gap-12 relative flex-1">
              <div className="absolute left-[15px] top-2 bottom-12 w-px bg-outline-variant/20"></div>
              
              <div className="flex items-start gap-6 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${progress >= 10 ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-highest border-outline-variant/20 text-on-surface-variant'}`}>
                  {progress >= 10 ? <Check size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`text-sm font-display font-bold ${progress >= 10 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Sandbox Initialization</span>
                  <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-mono">Status: {progress >= 10 ? 'READY' : 'WAITING'}</span>
                </div>
              </div>

              <div className="flex items-start gap-6 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${progress >= 30 ? 'bg-primary/20 border-primary text-primary' : progress >= 10 ? 'bg-primary/5 border-primary/40 text-primary animate-pulse' : 'bg-surface-highest border-outline-variant/20 text-on-surface-variant'}`}>
                  {progress >= 30 ? <Check size={16} /> : progress >= 10 ? <Loader2 size={16} className="animate-spin" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`text-sm font-display font-bold ${progress >= 10 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Data Profiling</span>
                  <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-mono">Agent: Data Surveyor</span>
                </div>
              </div>

              <div className="flex items-start gap-6 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${progress >= 70 ? 'bg-primary/20 border-primary text-primary' : progress >= 30 ? 'bg-primary/5 border-primary/40 text-primary animate-pulse' : 'bg-surface-highest border-outline-variant/20 text-on-surface-variant'}`}>
                  {progress >= 70 ? <Check size={16} /> : progress >= 30 ? <Loader2 size={16} className="animate-spin" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`text-sm font-display font-bold ${progress >= 30 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Bias Adjudication</span>
                  <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-mono">Agent: Fairness Adjudicator</span>
                </div>
              </div>

              {isComplete && (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary w-full py-4 mt-auto flex items-center justify-center gap-3 text-xs tracking-widest animate-in zoom-in-95 duration-500"
                >
                  VIEW FULL REPORT
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </section>

          {/* Thought Stream Column */}
          <section className="flex-1 flex flex-col bg-surface-lowest/30 overflow-hidden">
            <header className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/10">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${!isComplete ? 'bg-primary animate-pulse' : 'bg-on-surface-variant/20'}`}></div>
                </div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-on-surface-variant">Lustitia Protocol Thought Stream</span>
              </div>
              <div className="flex items-center gap-6">
                 <span className="text-[9px] uppercase font-mono tracking-widest text-primary font-bold">{status}</span>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-3 font-mono">
              {logs.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-20 select-none">
                   <div className="w-12 h-12 rounded-full border-2 border-dashed border-on-surface-variant animate-spin-slow"></div>
                   <span className="text-[10px] uppercase tracking-widest font-bold">Awaiting Stream Packets...</span>
                </div>
              )}
              {logs.map((log, i) => (
                <LogEntry key={i} time={log.time} text={log.text} type={log.type} />
              ))}
              <div ref={logEndRef} />
            </div>

            <footer className="p-8 grid grid-cols-3 gap-6 border-t border-outline-variant/10">
               <div className="card p-5 flex flex-col gap-2 bg-surface-low/40">
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-widest">Pipeline Health</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xl font-display font-bold text-on-surface">NOMINAL</span>
                  </div>
               </div>
               <div className="card p-5 flex flex-col gap-2 bg-surface-low/40">
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-widest">Completion</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-bold text-on-surface">{progress}%</span>
                  </div>
               </div>
               <div className="card p-5 flex flex-col gap-2 bg-surface-low/40 relative group overflow-hidden">
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-widest">System Entropy</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-display font-bold text-secondary">0.023</span>
                    <Activity size={14} className="text-secondary opacity-50" />
                  </div>
               </div>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
};
