"use client";

import { useCallback, useState } from "react";
import {
  FlaskConical,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  PlugZap,
} from "lucide-react";
import { BIASPROBE_API_BASE_URL } from "../lib/config";
import {
  BIAS_DIMENSION_PRESETS,
  ENDPOINT_PRESET_DEFAULTS,
  type BiasProbeRunRequest,
  type EndpointPreset,
  type TargetEndpointConfig,
} from "../lib/biasprobeTypes";

interface BiasProbeConfigFormProps {
  onStartRun: (req: BiasProbeRunRequest) => void;
  isRunning: boolean;
}

const PRESETS: { id: EndpointPreset; label: string }[] = [
  { id: "openai", label: "OpenAI-compatible" },
  { id: "anthropic", label: "Anthropic" },
  { id: "ollama", label: "Ollama" },
  { id: "custom", label: "Custom" },
];

export default function BiasProbeConfigForm({ onStartRun, isRunning }: BiasProbeConfigFormProps) {
  const [preset, setPreset] = useState<EndpointPreset>("ollama");
  const [label, setLabel] = useState("My Target Model");
  const [baseUrl, setBaseUrl] = useState(ENDPOINT_PRESET_DEFAULTS.ollama.base_url);
  const [modelId, setModelId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [method, setMethod] = useState("POST");
  const [headerRows, setHeaderRows] = useState<{ key: string; value: string }[]>([]);
  const [requestTemplate, setRequestTemplate] = useState(
    '{\n  "model": "your-model-id",\n  "input": "{{prompt}}"\n}'
  );
  const [responsePath, setResponsePath] = useState("choices[0].message.content");

  const [useCase, setUseCase] = useState("");
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [customDimension, setCustomDimension] = useState("");
  const [numScenarios, setNumScenarios] = useState(5);
  const [variantsPerDimension, setVariantsPerDimension] = useState(3);

  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");

  const switchPreset = useCallback((p: EndpointPreset) => {
    setPreset(p);
    setBaseUrl(ENDPOINT_PRESET_DEFAULTS[p].base_url);
    setModelId("");
    setTestStatus("idle");
    setTestMessage("");
  }, []);

  const toggleDimension = (dim: string) => {
    setDimensions((prev) => (prev.includes(dim) ? prev.filter((d) => d !== dim) : [...prev, dim]));
  };

  const addCustomDimension = () => {
    const d = customDimension.trim().toLowerCase().replace(/\s+/g, "_");
    if (d && !dimensions.includes(d)) setDimensions((prev) => [...prev, d]);
    setCustomDimension("");
  };

  const buildEndpointConfig = useCallback(
    (): TargetEndpointConfig => ({
      label,
      preset,
      base_url: baseUrl.trim(),
      model_id: modelId.trim(),
      api_key: apiKey.trim() || null,
      method,
      headers: Object.fromEntries(
        headerRows.filter((h) => h.key.trim()).map((h) => [h.key.trim(), h.value])
      ),
      request_template: preset === "custom" ? requestTemplate : null,
      response_path: preset === "custom" ? responsePath.trim() : null,
      timeout: 120,
    }),
    [label, preset, baseUrl, modelId, apiKey, method, headerRows, requestTemplate, responsePath]
  );

  const customTemplateValid = requestTemplate.includes("{{prompt}}") && responsePath.trim().length > 0;
  const canTest = baseUrl.trim().length > 0 && (preset !== "custom" || customTemplateValid);
  const canStart =
    baseUrl.trim().length > 0 &&
    modelId.trim().length > 0 &&
    useCase.trim().length > 10 &&
    (preset !== "custom" || testStatus === "success");

  const runTestConnection = useCallback(async () => {
    setTestStatus("testing");
    setTestMessage("");
    try {
      const res = await fetch(`${BIASPROBE_API_BASE_URL}/biasprobe/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: buildEndpointConfig() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTestStatus("error");
        setTestMessage(body.detail ?? "Test failed");
        return;
      }
      setTestStatus("success");
      setTestMessage(body.extracted_text ?? "(empty response)");
    } catch {
      setTestStatus("error");
      setTestMessage("BiasProbe backend not reachable");
    }
  }, [buildEndpointConfig]);

  const handleStart = () => {
    if (!canStart) return;
    onStartRun({
      use_case: useCase.trim(),
      endpoint: buildEndpointConfig(),
      dimensions: dimensions.length > 0 ? dimensions : null,
      num_scenarios: numScenarios,
      variants_per_dimension: variantsPerDimension,
    });
  };

  const inputCls =
    "w-full bg-[#111317] border border-[#2A2D35] rounded-lg px-3 py-2 text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-amber-500/50 transition-colors";
  const labelCls = "text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold";

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-[#15171B] border border-[#1F2228] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#1F2228]">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <FlaskConical className="w-4.5 h-4.5 text-amber-400" />
        </div>
        <div>
          <span className="text-sm font-semibold text-on-surface block">Target Endpoint + Audit Config</span>
          <span className="text-[11px] text-on-surface-variant">Point BiasProbe at any LLM API and describe how it's deployed.</span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Endpoint Preset</label>
          <div className="grid grid-cols-4 gap-1 rounded-lg overflow-hidden border border-[#2A2D35] bg-[#111317] p-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => switchPreset(p.id)}
                disabled={isRunning}
                className={`py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${
                  preset === p.id ? "bg-amber-500/20 text-amber-400" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Base URL</label>
          <input
            className={inputCls}
            value={baseUrl}
            onChange={(e) => { setBaseUrl(e.target.value); setTestStatus("idle"); }}
            disabled={isRunning}
            placeholder="http://localhost:11434"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Model ID</label>
            <input
              className={inputCls}
              value={modelId}
              onChange={(e) => { setModelId(e.target.value); setTestStatus("idle"); }}
              disabled={isRunning}
              placeholder={ENDPOINT_PRESET_DEFAULTS[preset].model_placeholder || "model-id"}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>
              API Key {preset === "ollama" && <span className="normal-case text-on-surface-variant/50">(optional)</span>}
            </label>
            <input
              className={inputCls}
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setTestStatus("idle"); }}
              disabled={isRunning}
              placeholder="sk-... (session-only, never saved)"
            />
          </div>
        </div>

        {preset === "custom" && (
          <div className="flex flex-col gap-3 p-3 rounded-lg bg-[#111317] border border-[#2A2D35]">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5 col-span-1">
                <label className={labelCls}>Method</label>
                <select
                  className={inputCls}
                  value={method}
                  onChange={(e) => { setMethod(e.target.value); setTestStatus("idle"); }}
                  disabled={isRunning}
                >
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className={labelCls}>Headers</label>
                <div className="flex flex-col gap-1.5">
                  {headerRows.map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input
                        className={`${inputCls} !py-1.5`}
                        value={h.key}
                        placeholder="Header-Name"
                        disabled={isRunning}
                        onChange={(e) => {
                          const next = [...headerRows];
                          next[i] = { ...next[i], key: e.target.value };
                          setHeaderRows(next);
                          setTestStatus("idle");
                        }}
                      />
                      <input
                        className={`${inputCls} !py-1.5`}
                        value={h.value}
                        placeholder="value"
                        disabled={isRunning}
                        onChange={(e) => {
                          const next = [...headerRows];
                          next[i] = { ...next[i], value: e.target.value };
                          setHeaderRows(next);
                          setTestStatus("idle");
                        }}
                      />
                      <button
                        onClick={() => setHeaderRows(headerRows.filter((_, idx) => idx !== i))}
                        disabled={isRunning}
                        className="text-on-surface-variant hover:text-error cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setHeaderRows([...headerRows, { key: "", value: "" }])}
                    disabled={isRunning}
                    className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer self-start"
                  >
                    <Plus className="w-3 h-3" /> Add header
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>
                Request Body Template <span className="normal-case text-on-surface-variant/50">(must contain literal {"{{prompt}}"})</span>
              </label>
              <textarea
                className={`${inputCls} font-mono !text-[11px] min-h-[90px] resize-y`}
                value={requestTemplate}
                onChange={(e) => { setRequestTemplate(e.target.value); setTestStatus("idle"); }}
                disabled={isRunning}
              />
              {!requestTemplate.includes("{{prompt}}") && (
                <span className="text-[10px] text-error">Missing {"{{prompt}}"} placeholder</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Response Path</label>
              <input
                className={`${inputCls} font-mono`}
                value={responsePath}
                onChange={(e) => { setResponsePath(e.target.value); setTestStatus("idle"); }}
                disabled={isRunning}
                placeholder="choices[0].message.content"
              />
            </div>

            <button
              onClick={runTestConnection}
              disabled={!canTest || testStatus === "testing" || isRunning}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#1F2228] border border-[#2A2D35] text-[11px] font-semibold text-on-surface hover:border-amber-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {testStatus === "testing" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PlugZap className="w-3.5 h-3.5" />
              )}
              Test Connection
            </button>

            {testStatus === "success" && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-[#4edea3]/10 border border-[#4edea3]/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[#4edea3] break-words">Extracted: &ldquo;{testMessage}&rdquo;</span>
              </div>
            )}
            {testStatus === "error" && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-error/10 border border-error/30">
                <XCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                <span className="text-[11px] text-error break-words">{testMessage}</span>
              </div>
            )}
          </div>
        )}

        <div className="h-px bg-[#1F2228]" />

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Use Case</label>
          <textarea
            className={`${inputCls} min-h-[64px] resize-y`}
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            disabled={isRunning}
            placeholder="An agentic platform that screens resumes and recommends hire/no-hire decisions"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>
            Dimensions <span className="normal-case text-on-surface-variant/50">(leave empty to let the generator decide)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {BIAS_DIMENSION_PRESETS.map((dim) => (
              <button
                key={dim}
                onClick={() => toggleDimension(dim)}
                disabled={isRunning}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer disabled:cursor-not-allowed ${
                  dimensions.includes(dim)
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                    : "bg-[#111317] border-[#2A2D35] text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {dim}
              </button>
            ))}
            {dimensions.filter((d) => !BIAS_DIMENSION_PRESETS.includes(d)).map((dim) => (
              <button
                key={dim}
                onClick={() => toggleDimension(dim)}
                disabled={isRunning}
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-amber-500/20 border-amber-500/40 text-amber-400 cursor-pointer"
              >
                {dim} <X className="w-2.5 h-2.5 inline ml-0.5" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <input
              className={`${inputCls} !py-1.5`}
              value={customDimension}
              onChange={(e) => setCustomDimension(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomDimension(); } }}
              disabled={isRunning}
              placeholder="add custom dimension..."
            />
            <button
              onClick={addCustomDimension}
              disabled={isRunning}
              className="p-2 rounded-lg bg-[#111317] border border-[#2A2D35] text-on-surface-variant hover:text-amber-400 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Scenarios</label>
            <input
              type="number"
              min={1}
              max={10}
              className={inputCls}
              value={numScenarios}
              disabled={isRunning}
              onChange={(e) => setNumScenarios(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Variants / Dimension</label>
            <input
              type="number"
              min={2}
              max={5}
              className={inputCls}
              value={variantsPerDimension}
              disabled={isRunning}
              onChange={(e) => setVariantsPerDimension(Math.max(2, Math.min(5, Number(e.target.value) || 2)))}
            />
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!canStart || isRunning}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-amber-500 text-[#15171B] text-[13px] font-semibold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
          {isRunning ? "Run in progress…" : "Start BiasProbe Run"}
        </button>
        {preset === "custom" && testStatus !== "success" && (
          <span className="text-[10px] text-on-surface-variant/60 text-center -mt-1">
            Test Connection must pass before starting a custom-endpoint run.
          </span>
        )}
      </div>
    </div>
  );
}
