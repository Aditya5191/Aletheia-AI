"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { MODEL_API_BASE_URL } from "../lib/config";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import {
  Box,
  Check,
  Loader2,
  MoreHorizontal,
  CloudUpload,
  File,
  ChevronDown,
  ArrowRight,
  X,
} from "lucide-react";
import { useViewMode } from "./ViewModeContext";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ModelUploadNodeData {
  title: string;
  onUploadComplete?: (modelType: string) => void;
  onTypeChange?: (modelType: string) => void;
  [key: string]: unknown;
}

export type ModelUploadNodeType = Node<ModelUploadNodeData, "model-upload">;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function ModelUploadNode({ data }: NodeProps<ModelUploadNodeType>) {
  const { viewMode } = useViewMode();

  const [modelType, setModelType] = useState<"classification" | "regression">("classification");
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDoneUploading, setIsDoneUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDragOverModel, setIsDragOverModel] = useState(false);
  const [isDragOverSample, setIsDragOverSample] = useState(false);

  const modelInputRef = useRef<HTMLInputElement>(null);
  const sampleInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Check existing uploads on mount
  useEffect(() => {
    if (viewMode === "test-developer") return;
    fetch(`${MODEL_API_BASE_URL}/model/status`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ready) {
          setIsDoneUploading(true);
          if (d.model_type) setModelType(d.model_type);
        }
      })
      .catch(() => {});
  }, [viewMode]);

  const stageModelFile = useCallback((file: File) => {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pkl") && !lower.endsWith(".joblib")) {
      setError("Model must be a .pkl or .joblib file");
      return;
    }
    setError("");
    setModelFile(file);
  }, []);

  const stageSampleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Sample must be a .csv file");
      return;
    }
    setError("");
    setSampleFile(file);
  }, []);

  const submitUpload = useCallback(async () => {
    if (!modelFile || !sampleFile) return;
    setIsUploading(true);
    setError("");
    try {
      // Upload model
      const modelForm = new FormData();
      modelForm.append("file", modelFile);
      modelForm.append("model_type", modelType);
      const modelRes = await fetch(`${MODEL_API_BASE_URL}/upload/model`, {
        method: "POST",
        body: modelForm,
      });
      if (!modelRes.ok) {
        const body = await modelRes.json().catch(() => ({}));
        setError(body.message ?? "Model upload failed");
        return;
      }

      // Upload sample
      const sampleForm = new FormData();
      sampleForm.append("file", sampleFile);
      const sampleRes = await fetch(`${MODEL_API_BASE_URL}/upload/sample`, {
        method: "POST",
        body: sampleForm,
      });
      if (!sampleRes.ok) {
        const body = await sampleRes.json().catch(() => ({}));
        setError(body.message ?? "Sample upload failed");
        return;
      }

      setIsDoneUploading(true);
      data.onUploadComplete?.(modelType);
    } catch {
      setError("Backend not reachable");
    } finally {
      setIsUploading(false);
    }
  }, [modelFile, sampleFile, modelType, data]);

  return (
    <div className="relative w-[340px] rounded-2xl bg-[#15171B] border border-[#1F2228] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-visible">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2228]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Box className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-on-surface">Upload Model</span>
        </div>
        <button className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-[#1F2228] transition-colors cursor-pointer">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Model Type Toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
            Problem Type
          </label>
          <div className="flex rounded-lg overflow-hidden border border-[#2A2D35] bg-[#111317]">
            {(["classification", "regression"] as const).map((type) => (
              <button
                key={type}
                onClick={() => { 
                  setModelType(type);
                  data.onTypeChange?.(type);
                  if (isDoneUploading && modelType !== type) {
                    setIsDoneUploading(false);
                  }
                }}
                className={`flex-1 py-2 text-[11px] font-semibold transition-all cursor-pointer ${
                  modelType === type
                    ? "bg-primary/20 text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Model File */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
            Model File <span className="normal-case text-on-surface-variant/50">(.pkl / .joblib)</span>
          </label>
          {modelFile ? (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <File className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-[12px] font-medium text-on-surface flex-1 truncate">{modelFile.name}</span>
              <span className="text-[10px] text-on-surface-variant flex-shrink-0">{formatSize(modelFile.size)}</span>
              {!isDoneUploading && (
                <button onClick={() => setModelFile(null)} className="text-on-surface-variant hover:text-on-surface cursor-pointer flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div
              className={`relative rounded-xl border-2 border-dashed p-4 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                isDragOverModel ? "border-primary bg-primary/5" : "border-[#2A2D35] hover:border-[#3A3D45] bg-[#111317]"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOverModel(true); }}
              onDragLeave={() => setIsDragOverModel(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOverModel(false); const f = e.dataTransfer.files?.[0]; if (f) stageModelFile(f); }}
              onClick={() => modelInputRef.current?.click()}
            >
              <CloudUpload className="w-5 h-5 text-on-surface-variant" />
              <p className="text-[11px] text-on-surface-variant">
                Drop or <span className="text-primary">browse</span>
              </p>
            </div>
          )}
          <input ref={modelInputRef} type="file" accept=".pkl,.joblib" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) stageModelFile(f); if (modelInputRef.current) modelInputRef.current.value = ""; }} />
        </div>

        {/* Sample CSV */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
            Sample Data <span className="normal-case text-on-surface-variant/50">(.csv)</span>
          </label>
          {sampleFile ? (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <File className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-[12px] font-medium text-on-surface flex-1 truncate">{sampleFile.name}</span>
              <span className="text-[10px] text-on-surface-variant flex-shrink-0">{formatSize(sampleFile.size)}</span>
              {!isDoneUploading && (
                <button onClick={() => setSampleFile(null)} className="text-on-surface-variant hover:text-on-surface cursor-pointer flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div
              className={`relative rounded-xl border-2 border-dashed p-4 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                isDragOverSample ? "border-primary bg-primary/5" : "border-[#2A2D35] hover:border-[#3A3D45] bg-[#111317]"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOverSample(true); }}
              onDragLeave={() => setIsDragOverSample(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOverSample(false); const f = e.dataTransfer.files?.[0]; if (f) stageSampleFile(f); }}
              onClick={() => sampleInputRef.current?.click()}
            >
              <CloudUpload className="w-5 h-5 text-on-surface-variant" />
              <p className="text-[11px] text-on-surface-variant">
                Drop or <span className="text-primary">browse</span>
              </p>
            </div>
          )}
          <input ref={sampleInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) stageSampleFile(f); if (sampleInputRef.current) sampleInputRef.current.value = ""; }} />
        </div>

        {error && <p className="text-[10px] text-error font-medium">{error}</p>}

        {/* Status / Submit */}
        {isDoneUploading ? (
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[#4edea3]/10 border border-[#4edea3]/30">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#4edea3]" />
              <span className="text-[12px] font-semibold text-[#4edea3]">
                {modelType.charAt(0).toUpperCase() + modelType.slice(1)} model ready
              </span>
            </div>
            <button 
              onClick={() => {
                setIsDoneUploading(false);
                setModelFile(null);
                setSampleFile(null);
              }}
              className="text-[#4edea3] hover:text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-[#4edea3]/10 hover:bg-[#4edea3]/30 transition-all"
            >
              Start Over
            </button>
          </div>
        ) : (
          <button
            onClick={submitUpload}
            disabled={isUploading || !modelFile || !sampleFile}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-[#15171B] text-[12px] font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            {isUploading ? "Uploading…" : "Upload & Continue"}
          </button>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-primary !border-[3px] !border-[#15171B] !-right-[7px] !shadow-[0_0_8px_rgba(208,188,255,0.5)]"
      />
    </div>
  );
}

export default memo(ModelUploadNode);
