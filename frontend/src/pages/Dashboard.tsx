import React, { useEffect, useState } from 'react';
import { AuditHeader } from '../components/AuditHeader';
import { ShieldCheck, FileText, Download, LayoutDashboard, Image as ImageIcon } from 'lucide-react';
import { getOutputUrl, listOutputs } from '../services/api';

const MarkdownView: React.FC<{ title: string; content: string; icon: React.ReactNode }> = ({ title, content, icon }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
        <div className="text-primary">{icon}</div>
        <h3 className="text-sm font-display font-bold text-on-surface uppercase tracking-[0.2em]">{title}</h3>
      </div>
      <div className="card p-8 bg-surface-low/30 backdrop-blur-sm border border-white/[0.02] shadow-xl">
        <div className="prose prose-invert prose-sm max-w-none">
          {content.split('\n').map((line, i) => {
            if (line.startsWith('### ')) return <h4 key={i} className="text-primary font-bold mt-4 mb-2 text-base uppercase tracking-wider">{line.replace('### ', '')}</h4>;
            if (line.startsWith('## ')) return <h3 key={i} className="text-primary font-bold mt-6 mb-3 text-lg uppercase tracking-widest border-b border-primary/20 pb-1">{line.replace('## ', '')}</h3>;
            if (line.startsWith('# ')) return <h2 key={i} className="text-2xl font-display font-bold text-on-surface mb-6 uppercase tracking-tighter">{line.replace('# ', '')}</h2>;
            if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="text-on-surface-variant ml-4 mb-1 list-disc">{line.substring(2)}</li>;
            if (line.trim() === '') return <div key={i} className="h-4" />;
            if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-on-surface font-bold my-2">{line.replace(/\*\*/g, '')}</p>;
            
            // Basic bold support
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
              <p key={i} className="text-on-surface-variant leading-relaxed mb-3">
                {parts.map((part, j) => 
                  part.startsWith('**') && part.endsWith('**') 
                    ? <strong key={j} className="text-on-surface">{part.replace(/\*\*/g, '')}</strong> 
                    : part
                )}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [agent1Content, setAgent1Content] = useState<string>("");
  const [agent2Content, setAgent2Content] = useState<string>("");
  const [plots, setPlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch file list
        const { files } = await listOutputs();
        const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png'));
        setPlots(pngFiles);

        // 2. Fetch Agent 1 and extract Handover Notes
        const res1 = await fetch(getOutputUrl('agent1.md'));
        if (res1.ok) {
          const text = await res1.text();
          const handoverStart = text.indexOf('## 9. Handover Notes for Fairness Adjudicator');
          if (handoverStart !== -1) {
            setAgent1Content(text.substring(handoverStart));
          } else {
            setAgent1Content("Handover notes section not found in Surveyor report.");
          }
        }

        // 3. Fetch Agent 2 full content
        const res2 = await fetch(getOutputUrl('agent2.md'));
        if (res2.ok) {
          const text = await res2.text();
          setAgent2Content(text);
        }

      } catch (e) {
        console.error("Failed to load audit artifacts", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary">Syncing Forensic Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-transparent p-10 selection:bg-primary/30">
      <div className="max-w-6xl mx-auto flex flex-col gap-16 pb-32">
        <AuditHeader />
        
        {/* Visual Assets Section */}
        {plots.length > 0 && (
          <section>
            <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4 mb-8">
              <ImageIcon size={18} className="text-primary" />
              <h3 className="text-sm font-display font-bold text-on-surface uppercase tracking-[0.2em]">Visual Evidence Gallery</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {plots.map((plot, i) => (
                <div key={i} className="flex flex-col gap-4 group">
                  <div className="relative aspect-video bg-surface-lowest/50 rounded-lg overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-500 shadow-2xl">
                    <img 
                      src={getOutputUrl(plot)} 
                      alt={plot} 
                      className="w-full h-full object-contain p-4 group-hover:scale-[1.02] transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-lowest/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">{plot}</span>
                    <a href={getOutputUrl(plot)} target="_blank" className="text-[10px] text-primary font-bold hover:underline">FULL RES</a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Markdown Reports */}
        <div className="grid grid-cols-1 gap-16">
          {agent1Content && (
            <MarkdownView 
              title="Handover Notes: Data Surveyor" 
              content={agent1Content} 
              icon={<LayoutDashboard size={18} />} 
            />
          )}
          
          {agent2Content && (
            <MarkdownView 
              title="Adjudicator Verdict: Full Report" 
              content={agent2Content} 
              icon={<ShieldCheck size={18} />} 
            />
          )}
        </div>
        
        {/* Integrity Section */}
        <div className="flex items-center justify-between p-10 bg-surface-low/30 rounded-lg border border-white/[0.03] backdrop-blur-md mt-8 shadow-inner">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(80,220,192,0.1)] border border-primary/20">
              <ShieldCheck size={32} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-lg font-display font-bold text-on-surface uppercase tracking-widest">Audit Lifecycle Complete</span>
              <span className="text-sm text-on-surface-variant opacity-60">All findings have been logged to the Lustitia immutable ledger.</span>
            </div>
          </div>
          <button className="bg-primary/10 text-primary border border-primary/20 px-8 py-4 rounded font-display font-bold text-xs uppercase tracking-[0.3em] hover:bg-primary hover:text-surface-lowest transition-all flex items-center gap-3 group">
            DOWNLOAD ARCHIVE
            <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
