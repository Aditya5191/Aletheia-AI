import React from 'react';
import { Check, Loader2, Cpu, Activity, ShieldCheck, AlertCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LogEntry: React.FC<{ time: string; text: string; type?: 'info' | 'warn' | 'success' }> = ({ time, text, type = 'info' }) => (
  <div className="flex gap-4 font-mono text-[11px] leading-relaxed">
    <span className="text-on-surface-variant/40 shrink-0">{time}</span>
    <span className={type === 'warn' ? 'text-secondary' : type === 'success' ? 'text-primary' : 'text-on-surface-variant'}>
      {type === 'warn' && <span className="mr-2">⚠</span>}
      {type === 'success' && <span className="mr-2">→</span>}
      {text}
    </span>
  </div>
);

export const LiveAudit: React.FC = () => {
  const navigate = useNavigate();

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
        {/* Left Sidebar (Mini) */}
        <aside className="w-64 border-r border-outline-variant/5 bg-surface-lowest/50 flex flex-col p-6 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 bg-surface-highest/30 rounded-md border border-outline-variant/10">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                <Cpu size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-display font-bold uppercase tracking-widest text-on-surface">Active Probe</span>
                <span className="text-[8px] text-on-surface-variant font-mono uppercase tracking-tighter">FS-7742-CLINICAL</span>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-4">
            {['Dashboard', 'Bias Forensic', 'Clinical Logs', 'Audit History', 'System Settings'].map((item) => (
              <button key={item} className={`flex items-center gap-3 text-[10px] uppercase font-label font-bold tracking-widest ${item === 'Dashboard' ? 'text-primary' : 'text-on-surface-variant'}`}>
                <div className={`w-1 h-1 rounded-full ${item === 'Dashboard' ? 'bg-primary shadow-[0_0_8px_rgba(80,220,192,0.8)]' : 'bg-transparent'}`}></div>
                {item}
              </button>
            ))}
          </nav>

          <button 
            onClick={() => navigate('/')}
            className="mt-auto flex items-center gap-2 text-[9px] text-on-surface-variant uppercase tracking-widest font-bold hover:text-secondary transition-colors"
          >
            <XCircle size={12} />
            Cancel audit
          </button>
        </aside>

        {/* Main Split */}
        <main className="flex-1 flex overflow-hidden">
          {/* Progress Column */}
          <section className="w-96 flex flex-col p-10 border-r border-outline-variant/5 bg-surface-container-low/20">
            <div className="flex flex-col gap-1 mb-10">
              <span className="text-[10px] text-primary uppercase tracking-[0.4em] font-label font-bold">Live Forensic Protocol</span>
              <h2 className="text-4xl font-display font-bold text-on-surface uppercase tracking-tight">Audit Progress</h2>
            </div>

            <div className="flex flex-col gap-8 relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-outline-variant/10"></div>
              
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                  <Check size={16} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-display font-bold text-on-surface">Reading file</span>
                  <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-mono">Source: clinical_records_v4.parquet</span>
                </div>
              </div>

              <div className="flex items-start gap-6 relative z-10">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                  <Loader2 size={16} className="animate-spin" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-display font-bold text-primary">Identifying types</span>
                  <span className="text-[9px] text-primary/60 uppercase tracking-wider font-mono italic">Schema mapping in progress...</span>
                </div>
              </div>

              {['Analyzing numeric', 'Analyzing categorical', 'Checking correlations', 'Detecting bias signals', 'Writing report'].map((step) => (
                <div key={step} className="flex items-start gap-6 relative z-10 opacity-20">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                    <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant"></div>
                  </div>
                  <span className="text-sm font-display font-bold text-on-surface-variant mt-1">{step}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto card bg-surface-container-lowest/80 p-6 flex flex-col gap-4 border border-outline-variant/10">
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-on-surface-variant uppercase tracking-widest font-label font-bold">Estimated Completion</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-display font-bold text-on-surface">04:12</span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Remaining</span>
                  </div>
                </div>
                <div className="w-12 h-12 relative">
                   <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="stroke-surface-container-highest" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="stroke-primary" strokeWidth="3" strokeDasharray="40, 100" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                   </svg>
                </div>
              </div>
            </div>
          </section>

          {/* Thought Stream Column */}
          <section className="flex-1 flex flex-col bg-surface-container-lowest/30 overflow-hidden">
            <header className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/10">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-on-surface-variant/20"></div>
                  <div className="w-2 h-2 rounded-full bg-primary/40"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                </div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-on-surface-variant">Thought Stream - Agent_01</span>
              </div>
              <div className="flex items-center gap-6">
                 <span className="text-[9px] uppercase font-mono tracking-widest text-on-surface-variant">Bitrate: 4.2 MB/S</span>
                 <span className="text-[9px] uppercase font-mono tracking-widest text-primary font-bold">Encrypted</span>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-4">
              <LogEntry time="12:04:01" text="Loaded dataset: 14,522 rows × 23 columns." success />
              <LogEntry time="12:04:02" text="Found 6 numeric columns and 8 categorical columns." />
              <LogEntry time="12:04:04" text="→ age looks numeric but stored as object. Casting." success />
              <LogEntry time="12:04:05" text="Scanning for protected attributes..." />
              <div className="ml-16 px-4 py-2 bg-secondary/10 border-l border-secondary rounded-r text-secondary font-mono text-[10px] uppercase tracking-widest">
                Detected: gender, race
              </div>
              <LogEntry time="12:04:08" text="Initializing Forensic Slice analysis..." type="success" />
              <div className="ml-16 flex gap-2">
                 <span className="px-2 py-0.5 bg-surface-container-highest text-[8px] text-on-surface-variant font-mono rounded">REASONING: PEARSON_COEFF</span>
                 <span className="px-2 py-0.5 bg-surface-container-highest text-[8px] text-on-surface-variant font-mono rounded">KERNEL: RBF_SVM</span>
              </div>
              <LogEntry time="12:04:12" text="|" />
            </div>

            <footer className="p-8 grid grid-cols-3 gap-6 border-t border-outline-variant/10">
               <div className="card p-5 flex flex-col gap-3 bg-surface-container-low/40">
                  <span className="text-[9px] uppercase font-label font-bold text-on-surface-variant tracking-widest">Model Accuracy</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-bold text-on-surface">94.2%</span>
                    <span className="text-[10px] text-primary font-bold">+0.3%</span>
                  </div>
               </div>
               <div className="card p-5 flex flex-col gap-3 bg-surface-container-low/40">
                  <span className="text-[9px] uppercase font-label font-bold text-on-surface-variant tracking-widest">Skew Bias</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-bold text-secondary">0.14</span>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Moderate</span>
                  </div>
               </div>
               <div className="card p-5 flex flex-col gap-3 bg-surface-container-low/40 relative group overflow-hidden cursor-pointer hover:bg-surface-container-high/50 transition-all">
                  <div className="absolute top-0 right-0 p-2 text-primary opacity-20 group-hover:opacity-100 transition-opacity">
                    <ShieldCheck size={48} className="rotate-12" />
                  </div>
                  <span className="text-[9px] uppercase font-label font-bold text-on-surface-variant tracking-widest">Audit Integrity</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-display font-bold text-on-surface">Valid</span>
                    <ShieldCheck size={18} className="text-primary" />
                  </div>
               </div>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
};
