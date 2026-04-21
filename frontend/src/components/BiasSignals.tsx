import React from 'react';

export const BiasSignals: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 mb-12">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-primary text-xs font-mono">03 //</span>
        <h3 className="text-sm font-display font-bold text-on-surface uppercase tracking-widest">Bias Signals</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="card bg-surface-container-lowest p-8 flex flex-col items-center justify-center min-h-[320px]">
          {/* Mock Chart Placeholder */}
          <div className="w-full h-48 flex items-end gap-4 px-4">
            <div className="flex-1 bg-primary/20 h-[80%] rounded-t-sm relative group">
              <div className="absolute inset-x-0 bottom-0 bg-primary h-[60%] rounded-t-sm transition-all group-hover:opacity-80"></div>
            </div>
            <div className="flex-1 bg-secondary/20 h-[80%] rounded-t-sm relative group">
              <div className="absolute inset-x-0 bottom-0 bg-secondary h-[35%] rounded-t-sm transition-all group-hover:opacity-80"></div>
            </div>
            <div className="flex-1 bg-primary/20 h-[80%] rounded-t-sm relative group">
              <div className="absolute inset-x-0 bottom-0 bg-primary h-[65%] rounded-t-sm transition-all group-hover:opacity-80"></div>
            </div>
            <div className="flex-1 bg-secondary/20 h-[80%] rounded-t-sm relative group">
              <div className="absolute inset-x-0 bottom-0 bg-secondary h-[20%] rounded-t-sm transition-all group-hover:opacity-80"></div>
            </div>
          </div>
          
          <div className="flex gap-8 mt-8">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-on-surface-variant">
              <div className="w-2 h-2 bg-primary"></div>
              Base Frequency
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-on-surface-variant">
              <div className="w-2 h-2 bg-secondary"></div>
              Predicted Outcome
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h4 className="text-2xl font-display font-bold text-on-surface">Gender Disparity</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Forensic analysis indicates a significant <span className="text-secondary font-bold">disparate impact</span> in model outputs across gender categories. The model demonstrates a 42% higher rejection rate for female identifiers compared to male identifiers when all other clinical variables are held constant.
            </p>
          </div>
          
          <div className="p-6 bg-surface-container-high border-l-2 border-primary rounded-r-md italic">
            <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
              "Observed statistical parity difference exceeds the 80% rule threshold. Forensic flag raised for 'Gender' column."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
