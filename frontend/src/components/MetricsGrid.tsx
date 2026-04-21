import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue }) => (
  <div className="bg-surface-low p-8 rounded-md flex flex-col gap-3 min-w-[240px] flex-1 border border-white/[0.03]">
    <span className="text-xs text-on-surface-variant uppercase tracking-[0.2em] font-label font-bold opacity-70">{label}</span>
    <div className="flex items-baseline gap-3">
      <span className="text-5xl font-display font-bold text-on-surface tracking-tight">{value}</span>
      {subValue && <span className="text-primary text-base font-mono font-bold">{subValue}</span>}
    </div>
  </div>
);

export const MetricsGrid: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-4 mb-10">
      <MetricCard label="Total Rows" value="14.5k" />
      <MetricCard label="Columns" value="23" />
      <MetricCard label="Missing Data" value="0.2%" />
      <MetricCard label="Duration" value="1m 23s" />
    </div>
  );
};
