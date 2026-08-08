"use client";

import { Fragment, useCallback, useRef, useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, RotateCcw, Maximize2, Loader2 } from "lucide-react";
import { BIASPROBE_WS_BASE_URL } from "../lib/config";
import { useViewMode } from "./ViewModeContext";
import BiasProbeConfigForm from "./BiasProbeConfigForm";
import BiasProbeResultsModal, { RISK_COLOR, riskBadge } from "./BiasProbeResultsModal";
import { formatDecisionForDisplay, type BiasProbeRunRequest, type BiasReport, type JudgeVerdict, type ScenarioTemplate, type TargetResponse } from "../lib/biasprobeTypes";

type Phase = "config" | "running" | "done";

interface LiveRow extends TargetResponse {
  key: string;
  verdict?: JudgeVerdict;
}

function stageLabelFor(stage: string, total?: number): string {
  switch (stage) {
    case "generating_scenarios":
      return "Generating scenarios and attribute variants with Gemini…";
    case "building_counterfactuals":
      return "Building counterfactual prompts…";
    case "running_target":
      return `Running target model (0/${total ?? "?"})…`;
    case "judging":
      return `Judging with Gemini (0/${total ?? "?"})…`;
    case "aggregating":
      return "Aggregating results…";
    case "done":
      return "Done.";
    default:
      return stage;
  }
}

function summarizeAnswer(row: TargetResponse): string {
  if (row.parsed_decision) {
    const d = row.parsed_decision as Record<string, unknown>;
    const parts: string[] = [];
    if (d.choice !== undefined) parts.push(`choice: ${d.choice}`);
    if (d.recommend !== undefined) parts.push(`recommend: ${d.recommend}`);
    if (d.score !== undefined) parts.push(`score: ${d.score}`);
    if (parts.length > 0) return parts.join(", ");
  }
  return row.raw_response_text.slice(0, 120) + (row.raw_response_text.length > 120 ? "…" : "");
}

export default function BiasProbePanel() {
  const { isSidebarCollapsed } = useViewMode();
  const [phase, setPhase] = useState<Phase>("config");
  const [rows, setRows] = useState<LiveRow[]>([]);
  const [scenariosById, setScenariosById] = useState<Record<string, ScenarioTemplate>>({});
  const [stageLabel, setStageLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<BiasReport | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const handleStartRun = useCallback((req: BiasProbeRunRequest) => {
    setPhase("running");
    setRows([]);
    setScenariosById({});
    setError(null);
    setReport(null);
    setStageLabel("Connecting…");

    const ws = new WebSocket(`${BIASPROBE_WS_BASE_URL}/ws/biasprobe`);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify(req));

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "biasprobe_stage":
            setStageLabel(stageLabelFor(msg.stage, msg.total));
            break;
          case "biasprobe_scenarios": {
            const scenarios = (msg.scenarios ?? []) as ScenarioTemplate[];
            setScenariosById(Object.fromEntries(scenarios.map((s) => [s.scenario_id, s])));
            break;
          }
          case "biasprobe_target_response": {
            const r = msg.response as TargetResponse;
            const key = `${r.scenario_id}::${r.dimension}::${r.tested_position}::${r.tested_value}`;
            setRows((prev) => [...prev, { ...r, key }]);
            setStageLabel(`Running target model (${msg.completed}/${msg.total})…`);
            break;
          }
          case "biasprobe_verdict": {
            const v = msg.verdict as JudgeVerdict;
            setRows((prev) =>
              prev.map((row) =>
                row.scenario_id === v.scenario_id && row.dimension === v.dimension
                  ? { ...row, verdict: v }
                  : row
              )
            );
            setStageLabel(`Judging with Gemini (${msg.completed}/${msg.total})…`);
            break;
          }
          case "biasprobe_report":
            setReport(msg.report as BiasReport);
            setPhase("done");
            break;
          case "biasprobe_error":
            setError(msg.message ?? "Unknown error");
            setPhase("config");
            break;
        }
      } catch (e) {
        console.error("[BiasProbePanel] Failed to parse WS message", e);
      }
    };

    ws.onerror = () => {
      setError("Could not reach the BiasProbe backend.");
      setPhase("config");
    };
    ws.onclose = () => {
      wsRef.current = null;
    };
  }, []);

  const handleReset = () => {
    wsRef.current?.close();
    setPhase("config");
    setRows([]);
    setScenariosById({});
    setReport(null);
    setError(null);
  };

  return (
    <div
      className={`mt-[64px] min-h-[calc(100vh-64px)] relative transition-all duration-300 ease-in-out px-8 py-10 overflow-y-auto ${
        isSidebarCollapsed ? "ml-0" : "ml-[260px]"
      }`}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {phase === "config" && (
          <>
            {error && (
              <div className="max-w-2xl mx-auto w-full flex items-start gap-2 p-3 rounded-xl bg-error/10 border border-error/30">
                <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                <span className="text-[12px] text-error">{error}</span>
              </div>
            )}
            <BiasProbeConfigForm onStartRun={handleStartRun} isRunning={false} />
          </>
        )}

        {(phase === "running" || phase === "done") && (
          <div className="flex flex-col gap-5">
            {/* Status bar */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-outline-variant/50">
              <div className="flex items-center gap-3">
                {phase === "running" ? (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLOR[report?.overall_risk_rating ?? "low"] }} />
                )}
                <span className="text-sm font-semibold text-on-surface">
                  {phase === "running" ? stageLabel : `Run complete — overall risk ${report?.overall_risk_rating ?? ""}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {phase === "done" && (
                  <button
                    onClick={() => setShowFullReport(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/50 transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> View Full Report
                  </button>
                )}
                <button
                  onClick={handleReset}
                  disabled={phase === "running"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {phase === "running" ? "Running…" : "Run Another"}
                </button>
              </div>
            </div>

            {/* Live table */}
            <div className="rounded-xl bg-surface-container-low border border-outline-variant/50 overflow-hidden">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-outline-variant/50 text-on-surface-variant uppercase tracking-widest text-[10px]">
                    <th className="px-4 py-2.5 font-semibold">Scenario</th>
                    <th className="px-4 py-2.5 font-semibold">Dimension</th>
                    <th className="px-4 py-2.5 font-semibold">Matchup (A vs B)</th>
                    <th className="px-4 py-2.5 font-semibold">Target&apos;s Answer</th>
                    <th className="px-4 py-2.5 font-semibold">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && phase === "running" && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-on-surface-variant">
                        Waiting for the first response…
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => {
                    const isOpen = expandedRow === row.key;
                    return (
                      <Fragment key={row.key}>
                        <tr
                          onClick={() => setExpandedRow(isOpen ? null : row.key)}
                          className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-high/40 cursor-pointer transition-colors"
                        >
                          <td
                            className="px-4 py-2.5 text-on-surface font-medium whitespace-nowrap"
                            title={scenariosById[row.scenario_id]?.task_description}
                          >
                            {row.scenario_id}
                          </td>
                          <td className="px-4 py-2.5 text-on-surface-variant whitespace-nowrap">{row.dimension}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={row.tested_position === "a" ? "text-primary font-semibold" : "text-on-surface-variant"}>
                              A: {row.attribute_a}
                            </span>
                            <span className="text-on-surface-variant/40 mx-1.5">vs</span>
                            <span className={row.tested_position === "b" ? "text-primary font-semibold" : "text-on-surface-variant"}>
                              B: {row.attribute_b}
                            </span>
                            {row.tested_position === "baseline" && (
                              <span className="ml-1.5 text-[9px] text-on-surface-variant/50 uppercase tracking-widest">baseline</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-on-surface-variant max-w-[280px] truncate">{summarizeAnswer(row)}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              {row.verdict ? (
                                riskBadge(row.verdict.severity)
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-outline-variant/50 text-on-surface-variant">
                                  judging…
                                </span>
                              )}
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-on-surface-variant" /> : <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant" />}
                            </div>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-surface-container-lowest/60">
                            <td colSpan={5} className="px-4 py-3">
                              <div className="flex flex-col gap-2">
                                {scenariosById[row.scenario_id] && (
                                  <div>
                                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                                      Task
                                    </span>
                                    <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                                      {scenariosById[row.scenario_id].task_description}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                                    Prompt Sent
                                  </span>
                                  <pre className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5 whitespace-pre-wrap break-words font-sans">
                                    {row.raw_prompt_sent}
                                  </pre>
                                </div>
                                {(() => {
                                  const { reasoning, badges, rawFallback } = formatDecisionForDisplay(row);
                                  return (
                                    <div>
                                      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                                        Target&apos;s Reasoning
                                      </span>
                                      {badges.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1 mb-1">
                                          {badges.map((b) => (
                                            <span key={b.label} className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary border border-primary/30">
                                              {b.label}: {b.value}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                                        {reasoning ?? rawFallback ?? "(no response text)"}
                                      </p>
                                      {rawFallback && !reasoning && (
                                        <span className="text-[10px] text-error/80 italic block mt-1">
                                          Target did not return parseable JSON — showing raw text.
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                                {row.verdict ? (
                                  <div>
                                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                                      Judge verdict (divergence {row.verdict.outcome_divergence.toFixed(3)})
                                    </span>
                                    <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">{row.verdict.verdict_summary}</p>
                                    {row.verdict.language_bias_flags.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {row.verdict.language_bias_flags.map((flag, i) => (
                                          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-error/10 text-error border border-error/30">
                                            {flag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-on-surface-variant/60 italic">Waiting for this scenario+dimension group to be judged…</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Report summary — appears once the run is done */}
            {phase === "done" && report && (
              <div className="flex flex-col gap-3 p-5 rounded-xl bg-surface-container-low border border-outline-variant/50">
                <h3 className="text-sm font-bold text-on-surface">Report Summary</h3>
                <div className="flex flex-col gap-3">
                  {report.dimension_summaries.map((s) => {
                    const color = RISK_COLOR[s.risk_rating] ?? "#958ea0";
                    const pct = Math.round(s.avg_outcome_divergence * 100);
                    return (
                      <div key={s.dimension} className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[13px] font-semibold text-on-surface">{s.dimension}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-on-surface-variant">{s.high_severity_count}/{s.total_cases} flagged</span>
                            {riskBadge(s.risk_rating)}
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed italic">{report.disclaimer}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showFullReport && report && (
        <BiasProbeResultsModal report={report} onClose={() => setShowFullReport(false)} />
      )}
    </div>
  );
}
