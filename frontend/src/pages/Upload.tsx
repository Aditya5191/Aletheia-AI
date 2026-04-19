import React from 'react';
import { Upload as UploadIcon, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Upload: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 h-screen flex flex-col items-center justify-center bg-background p-10 relative overflow-hidden text-on-background">
      {/* Background Decal */}
      <div className="absolute top-10 right-10 text-[20rem] font-display font-bold text-surface-low opacity-[0.03] select-none">
        AA
      </div>

      <div className="max-w-2xl w-full flex flex-col items-center gap-12 z-10">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-6xl font-display font-bold text-primary uppercase tracking-tighter flex items-center gap-3">
            AletheiaAI<span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
          </h1>
          <p className="text-sm uppercase tracking-[0.4em] text-on-surface-variant font-label font-bold">AI Bias Audit System</p>
        </div>

        <div className="flex gap-12 border-b border-outline-variant/10 w-full justify-center pb-4">
          <button className="text-primary text-sm font-label font-bold uppercase tracking-widest border-b-2 border-primary pb-4 -mb-[18px]">Dataset</button>
          <button className="text-on-surface-variant text-sm font-label font-bold uppercase tracking-widest pb-4 hover:text-on-surface transition-colors">Model</button>
        </div>

        <div className="w-full h-80 border-2 border-dashed border-outline-variant/20 rounded-md flex flex-col items-center justify-center gap-6 bg-surface-container/30 hover:bg-surface-container/50 transition-all cursor-pointer group">
          <div className="w-16 h-16 rounded-md bg-surface-highest flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <UploadIcon size={32} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-lg font-display font-bold text-on-surface">Drop forensic artifacts here</p>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-label font-medium">Supports .csv, .pkl, .json, .h5</p>
          </div>
          <div className="mt-4 px-4 py-1.5 bg-surface-lowest text-xs text-on-surface-variant font-mono uppercase tracking-widest rounded border border-white/[0.03]">
            Max file size: 500MB
          </div>
        </div>

        <div className="w-full flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.2em]">Clinical Description</label>
            <button className="text-xs text-primary font-bold uppercase tracking-widest flex items-center gap-2 hover:underline">
              Why do we ask? <span className="bg-primary/20 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">?</span>
            </button>
          </div>
          <textarea 
            className="w-full h-40 bg-surface-lowest border border-white/[0.03] rounded-md p-6 text-base text-on-surface placeholder:text-on-surface-variant/20 focus:ring-1 focus:ring-primary/30 transition-all resize-none font-sans"
            placeholder="Briefly describe your data or model architecture for audit contextualization..."
          />
        </div>

        <button 
          onClick={() => navigate('/configuring')}
          className="btn-primary w-full py-5 flex items-center justify-center gap-4 text-sm tracking-[0.3em] font-bold"
        >
          <FileText size={20} />
          START AUDIT
        </button>

        <div className="flex gap-12">
          <div className="flex items-center gap-3 text-xs text-on-surface-variant uppercase tracking-widest font-label font-medium opacity-60">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
            Security: HIPAA Encrypted
          </div>
          <div className="flex items-center gap-3 text-xs text-on-surface-variant uppercase tracking-widest font-label font-medium opacity-60">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
            Node: US-EAST-CLINICAL
          </div>
        </div>
      </div>
    </div>
  );
};
