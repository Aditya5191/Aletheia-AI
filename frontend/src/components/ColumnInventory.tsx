import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ColumnItem {
  name: string;
  type: string;
  unique: string;
  relevance: string;
  notes: string;
  status?: 'validated' | 'sensitive' | 'redacted';
}

const inventory: ColumnItem[] = [
  { name: 'patient_id', type: 'String', unique: '14,500', relevance: 'Identifier', notes: 'Redacted', status: 'redacted' },
  { name: 'age', type: 'Integer', unique: '82', relevance: 'Clinical', notes: 'Validated', status: 'validated' },
  { name: 'gender', type: 'Categorical', unique: '2', relevance: 'Sensitive', notes: 'Signal Detected', status: 'sensitive' },
  { name: 'diagnosis_code', type: 'Categorical', unique: '412', relevance: 'Clinical', notes: 'Validated', status: 'validated' },
];

export const ColumnInventory: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 mb-12">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-primary text-xs font-mono">02 //</span>
        <h3 className="text-sm font-display font-bold text-on-surface uppercase tracking-widest">Column Inventory</h3>
      </div>
      
      <div className="card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-high/50">
              <th className="px-6 py-4 text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-medium">Column Name</th>
              <th className="px-6 py-4 text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-medium">Type</th>
              <th className="px-6 py-4 text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-medium">Unique</th>
              <th className="px-6 py-4 text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-medium">Clinical Relevance</th>
              <th className="px-6 py-4 text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-medium">Forensic Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {inventory.map((col) => (
              <tr key={col.name} className="hover:bg-surface-container-high/30 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-on-surface">{col.name}</td>
                <td className="px-6 py-4 text-xs text-on-surface-variant">{col.type}</td>
                <td className="px-6 py-4 text-xs text-on-surface-variant">{col.unique}</td>
                <td className="px-6 py-4 text-xs text-on-surface-variant">{col.relevance}</td>
                <td className="px-6 py-4 text-xs">
                  <div className="flex items-center gap-2">
                    {col.status === 'validated' && <span className="text-primary/70 text-[10px] uppercase font-bold tracking-tighter">Validated</span>}
                    {col.status === 'redacted' && <span className="text-on-surface-variant/50 text-[10px] uppercase font-bold tracking-tighter italic">Redacted</span>}
                    {col.status === 'sensitive' && (
                      <span className="text-secondary text-[10px] uppercase font-bold tracking-tighter flex items-center gap-1">
                        <AlertTriangle size={10} />
                        Signal Detected
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
