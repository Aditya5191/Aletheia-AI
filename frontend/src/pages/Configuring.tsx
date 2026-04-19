import React, { useEffect } from 'react';
import { Check, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Configuring: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/live-audit');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex-1 h-screen flex flex-col items-center justify-center p-10 relative bg-transparent">
      <div className="flex flex-col items-center gap-12 max-w-lg w-full">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] text-primary uppercase tracking-[0.4em] font-label font-bold">System Configuration</span>
          <h1 className="text-4xl font-display font-bold text-on-surface uppercase tracking-tight">Initializing Forensic Sandbox</h1>
        </div>

        <div className="card w-full bg-surface-container/50 p-8 flex flex-col gap-8">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <Check size={18} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-display font-bold text-on-surface">File received</span>
              <span className="text-[10px] text-primary font-mono uppercase tracking-widest">INTEGRITY_VERIFIED_SHA256</span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-md bg-surface-container-highest flex items-center justify-center text-on-surface">
              <Loader2 size={18} className="animate-spin text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-display font-bold text-on-surface">Provisioning sandbox...</span>
              <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">ALLOCATING_SECURE_RESOURCES</span>
            </div>
          </div>

          <div className="flex items-start gap-4 opacity-30">
            <div className="w-8 h-8 rounded-md bg-surface-container-highest flex items-center justify-center text-on-surface">
              <Lock size={18} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-display font-bold text-on-surface">Starting analysis agent</span>
              <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">PENDING_ENVIRONMENT_READY</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-on-surface-variant italic font-sans text-center max-w-xs">
            <ShieldCheck size={12} className="text-primary not-italic shrink-0" />
            Sandboxed environment. Your file never leaves secure analysis.
          </div>
          
          <div className="w-full bg-surface-container-lowest p-3 rounded font-mono text-[9px] text-on-surface-variant flex flex-col gap-1 border-l border-primary/40">
            <p className="flex gap-2"><span>&gt;</span> VPC_TUNNEL_ESTABLISHED</p>
            <p className="flex gap-2 text-primary/60"><span>&gt;</span> ENCRYPTED_VOL_MOUNTING...</p>
          </div>
        </div>
      </div>
    </div>
  );
};
