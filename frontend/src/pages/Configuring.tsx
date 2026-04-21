import React, { useEffect, useState } from 'react';
import { Check, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Configuring: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Simulate the transition as the backend API.py logic is handled inside LiveAudit's WebSocket mounting
    // But we'll do a quick delay to show the beautiful UI
    const t1 = setTimeout(() => setStep(2), 1500);
    const t2 = setTimeout(() => setStep(3), 3000);
    const t3 = setTimeout(() => navigate('/live-audit'), 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [navigate]);

  return (
    <div className="flex-1 h-screen flex flex-col items-center justify-center p-10 relative bg-transparent">
      <div className="flex flex-col items-center gap-12 max-w-lg w-full z-10">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] text-primary uppercase tracking-[0.4em] font-label font-bold">System Configuration</span>
          <h1 className="text-4xl font-display font-bold text-on-surface uppercase tracking-tight">Initializing Forensic Sandbox</h1>
        </div>

        <div className="card w-full bg-surface-low/40 p-10 flex flex-col gap-10 border border-white/[0.03] backdrop-blur-sm">
          <div className="flex items-start gap-5">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors duration-500 ${step >= 1 ? 'bg-primary/20 text-primary' : 'bg-surface-highest text-on-surface-variant'}`}>
              {step > 1 ? <Check size={20} /> : <Loader2 size={20} className="animate-spin" />}
            </div>
            <div className="flex flex-col gap-1">
              <span className={`text-base font-display font-bold ${step >= 1 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Artifact Receipt</span>
              <span className="text-[10px] text-primary font-mono uppercase tracking-widest opacity-70">INTEGRITY_VERIFIED_SHA256</span>
            </div>
          </div>

          <div className={`flex items-start gap-5 transition-opacity duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`w-10 h-10 rounded-md flex items-center justify-center ${step === 2 ? 'bg-primary/10 text-primary' : step > 2 ? 'bg-primary/20 text-primary' : 'bg-surface-highest text-on-surface-variant'}`}>
              {step > 2 ? <Check size={20} /> : <Loader2 size={20} className={step === 2 ? "animate-spin" : ""} />}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base font-display font-bold text-on-surface">Sandbox Provisioning</span>
              <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest opacity-70">ALLOCATING_SECURE_RESOURCES</span>
            </div>
          </div>

          <div className={`flex items-start gap-5 transition-opacity duration-500 ${step >= 3 ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`w-10 h-10 rounded-md flex items-center justify-center ${step === 3 ? 'bg-primary/10 text-primary' : 'bg-surface-highest text-on-surface-variant'}`}>
              {step === 3 ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20} />}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base font-display font-bold text-on-surface">Agent Deployment</span>
              <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest opacity-70">LUSTITIA_CORE_HANDSHAKE</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 text-xs text-on-surface-variant italic font-sans text-center max-w-sm leading-relaxed">
            <ShieldCheck size={16} className="text-primary not-italic shrink-0 opacity-80" />
            Zero-Trust isolation active. Data is processed within an ephemeral, air-gapped compute node.
          </div>
          
          <div className="w-full bg-surface-lowest/80 p-4 rounded-md font-mono text-[10px] text-on-surface-variant flex flex-col gap-2 border-l-2 border-primary/40 min-w-[300px]">
            <p className="flex gap-3">
              <span className="text-primary/40 tracking-tighter">14:02:11</span>
              <span className="text-primary/60">&gt;</span> 
              VPC_TUNNEL_ESTABLISHED
            </p>
            {step >= 2 && (
              <p className="flex gap-3 animate-in fade-in slide-in-from-left-2">
                <span className="text-primary/40 tracking-tighter">14:02:14</span>
                <span className="text-primary/60">&gt;</span> 
                MOUNTING_ENCRYPTED_VOL_DATA_CSV...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
