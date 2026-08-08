"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, BarChart3, ListTree, FileJson, Download, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { formatDecisionForDisplay, type BiasReport, type JudgeVerdict, type TargetResponse } from "../lib/biasprobeTypes";

interface BiasProbeResultsModalProps {
  report: BiasReport;
  onClose: () => void;
}

type Tab = "summary" | "cases" | "raw";

export const RISK_COLOR: Record<string, string> = {
  low: "#4edea3",
  medium: "#f59e0b",
  high: "#ff5252",
  none: "#4edea3",
};

export function riskBadge(risk: string) {
  const color = RISK_COLOR[risk] ?? "#958ea0";
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border"
      style={{ color, borderColor: `${color}55`, background: `${color}18` }}
    >
      {risk}
    </span>
  );
}

export default function BiasProbeResultsModal({ report, onClose }: BiasProbeResultsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const rankedVerdicts = useMemo(
    () => [...report.verdicts].sort((a, b) => b.outcome_divergence - a.outcome_divergence),
    [report.verdicts]
  );

  const scenarioById = useMemo(
    () => Object.fromEntries(report.scenarios.map((s) => [s.scenario_id, s])),
    [report.scenarios]
  );

  const responsesFor = (v: JudgeVerdict): TargetResponse[] =>
    report.responses.filter((r) => r.scenario_id === v.scenario_id && r.dimension === v.dimension);

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biasprobe_report_${report.generated_at.replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={backdropRef}
      onMouseDown={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
    >
      <div className="w-full max-w-[1100px] max-h-[calc(100vh-64px)] bg-surface-container border border-outline-variant rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-[slideUp_250ms_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-on-surface truncate">BiasProbe Report</h2>
              {riskBadge(report.overall_risk_rating)}
            </div>
            <p className="text-xs text-on-surface-variant truncate">
              {report.target_model} · judged by {report.judge_model}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={downloadReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/50 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download JSON
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-outline-variant shrink-0">
          {([
            { id: "summary", label: "Summary", icon: BarChart3 },
            { id: "cases", label: "Cases", icon: ListTree },
            { id: "raw", label: "Raw", icon: FileJson },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-surface-container text-primary border border-b-0 border-outline-variant"
                  : "text-on-surface-variant hover:text-on-surface-variant"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6" data-lenis-prevent="true">
          {activeTab === "summary" && (
            <div className="flex flex-col gap-6">
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/50">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Use Case</span>
                <p className="text-sm text-on-surface mt-1">{report.use_case}</p>
              </div>

              <div className="flex flex-col gap-3">
                {report.dimension_summaries.map((s) => {
                  const color = RISK_COLOR[s.risk_rating] ?? "#958ea0";
                  const pct = Math.round(s.avg_outcome_divergence * 100);
                  return (
                    <div key={s.dimension} className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-on-surface">{s.dimension}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-on-surface-variant">{s.high_severity_count}/{s.total_cases} flagged</span>
                          {riskBadge(s.risk_rating)}
                        </div>
                      </div>
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="text-[10px] text-on-surface-variant mt-1 block">avg divergence {s.avg_outcome_divergence.toFixed(3)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <AlertTriangle className="w-4 h-4 text-on-surface-variant shrink-0 mt-0.5" />
                <p className="text-[11px] text-on-surface-variant leading-relaxed">{report.disclaimer}</p>
              </div>
            </div>
          )}

          {activeTab === "cases" && (
            <div className="flex flex-col gap-2">
              {rankedVerdicts.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-8">No verdicts in this report.</p>
              )}
              {rankedVerdicts.map((v) => {
                const caseKey = `${v.scenario_id}::${v.dimension}`;
                const isOpen = expandedCase === caseKey;
                const responses = responsesFor(v);
                return (
                  <div key={caseKey} className="rounded-xl bg-surface-container-low border border-outline-variant/50 overflow-hidden">
                    <button
                      onClick={() => setExpandedCase(isOpen ? null : caseKey)}
                      className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-container-high/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-semibold text-on-surface truncate">{v.scenario_id}</span>
                        <span className="text-xs text-on-surface-variant shrink-0">/ {v.dimension}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-on-surface-variant">divergence {v.outcome_divergence.toFixed(3)}</span>
                        {riskBadge(v.severity)}
                        {isOpen ? <ChevronUp className="w-4 h-4 text-on-surface-variant" /> : <ChevronDown className="w-4 h-4 text-on-surface-variant" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 flex flex-col gap-3 border-t border-outline-variant/30 pt-3">
                        {scenarioById[v.scenario_id] && (
                          <p className="text-[11px] text-on-surface-variant/70 italic leading-relaxed">
                            {scenarioById[v.scenario_id].task_description}
                          </p>
                        )}
                        <p className="text-xs text-on-surface-variant leading-relaxed">{v.verdict_summary}</p>
                        {v.language_bias_flags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {v.language_bias_flags.map((flag, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-error/10 text-error border border-error/30">
                                {flag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(responses.length, 3) || 1}, minmax(0, 1fr))` }}>
                          {responses.map((r, i) => {
                            const { reasoning, badges, rawFallback } = formatDecisionForDisplay(r);
                            return (
                              <div key={i} className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-1.5 min-w-0">
                                <span className="text-[11px] font-bold text-primary truncate">
                                  {r.tested_position === "baseline" ? "baseline" : `${r.tested_position.toUpperCase()}: ${r.tested_value}`}
                                </span>
                                <span className="text-[9px] text-on-surface-variant/60 truncate">
                                  A: {r.attribute_a} · B: {r.attribute_b}
                                </span>
                                {badges.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {badges.map((b) => (
                                      <span key={b.label} className="px-1.5 py-0.5 rounded-full text-[9px] bg-primary/10 text-primary border border-primary/30">
                                        {b.label}: {b.value}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <p className="text-[10px] text-on-surface-variant/70 leading-snug line-clamp-4">
                                  {reasoning ?? rawFallback ?? "(no response text)"}
                                </p>
                                {rawFallback && !reasoning && (
                                  <span className="text-[9px] text-error/80 italic">not parseable JSON — raw text shown</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "raw" && (
            <pre className="text-[11px] text-on-surface-variant font-mono whitespace-pre-wrap break-words bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4">
              {JSON.stringify(report, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
