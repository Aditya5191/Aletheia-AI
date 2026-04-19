import React from 'react';
import { Calendar, Fingerprint, CheckCircle2 } from 'lucide-react';

export const AuditHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between pb-8 mb-8 border-b border-outline-variant/10">
      <div className="flex flex-col gap-1">
        <h2 className="text-4xl font-display font-bold text-on-surface uppercase tracking-tight">CLINICAL_DATASET_V4</h2>
        <div className="flex items-center gap-8 mt-3">
          <div className="flex items-center gap-2 text-on-surface-variant text-xs uppercase tracking-widest font-label">
            <Calendar size={16} className="text-primary opacity-70" />
            OCT 24, 2023
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant text-xs uppercase tracking-widest font-label">
            <Fingerprint size={16} className="text-primary opacity-70" />
            SHA-256: 0xA7...F2
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest font-label">
            <CheckCircle2 size={12} />
            COMPLETED
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-on-surface-variant uppercase tracking-[0.2em] font-label font-bold opacity-60">Observer ID</span>
        <span className="font-mono text-primary text-base tracking-widest font-bold">FS-092</span>
      </div>
    </div>
  );
};
