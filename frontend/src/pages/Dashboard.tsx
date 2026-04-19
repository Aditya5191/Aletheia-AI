import React from 'react';
import { AuditHeader } from '../components/AuditHeader';
import { MetricsGrid } from '../components/MetricsGrid';
import { ColumnInventory } from '../components/ColumnInventory';
import { BiasSignals } from '../components/BiasSignals';
import { ShieldCheck } from 'lucide-react';

export const Dashboard: React.FC = () => {
  return (
    <div className="flex-1 h-screen overflow-y-auto bg-transparent p-10">
      <div className="max-w-6xl mx-auto">
        <AuditHeader />
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary text-xs font-mono">01 //</span>
          <h3 className="text-sm font-display font-bold text-on-surface uppercase tracking-widest">Overview</h3>
        </div>
        <MetricsGrid />
        
        <ColumnInventory />
        
        <BiasSignals />
        
        {/* Integrity Section */}
        <div className="flex items-center justify-between p-6 bg-surface-container-high/30 rounded-md border border-outline-variant/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-display font-bold text-on-surface uppercase tracking-wider">Data Integrity Scan</span>
              <span className="text-xs text-on-surface-variant">Zero adversarial perturbations detected.</span>
            </div>
          </div>
          <button className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline transition-all">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};
