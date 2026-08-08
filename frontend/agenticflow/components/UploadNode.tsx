"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { API_BASE_URL } from "../lib/config";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import {
  FileSpreadsheet,
  Check,
  Loader2,
  MoreHorizontal,
  CloudUpload,
  File,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { useViewMode } from "./ViewModeContext";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface UploadNodeData {
  title: string;
  fileName?: string;
  fileSize?: string;
  isUploaded?: boolean;
  isUploading?: boolean;
  onUploadComplete?: (fileName: string, targetColumn?: string) => void;
  [key: string]: unknown;
}

export type UploadNodeType = Node<UploadNodeData, "upload">;

interface UploadedFile {
  name: string;
  size: string;
  active: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function UploadNode({ id, data }: NodeProps<UploadNodeType>) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [recentUploads, setRecentUploads] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { viewMode } = useViewMode();

  // Pending file + metadata state (two-step flow)
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [targetColumn, setTargetColumn] = useState("");

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const parseCsvHeaders = (file: File): Promise<string[]> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const firstLine = text.split("\n")[0] || "";
        const raw = firstLine
          .split(",")
          .map((c) => c.trim().replace(/^"|"$/g, ""))
          .filter(Boolean);
        // Deduplicate: append _2, _3 etc. for repeated names
        const seen: Record<string, number> = {};
        const cols = raw.map((c) => {
          if (seen[c] === undefined) { seen[c] = 0; return c; }
          seen[c] += 1;
          return `${c}_${seen[c] + 1}`;
        });
        resolve(cols);
      };
      // Only read first 4 KB — enough for headers
      reader.readAsText(file.slice(0, 4096));
    });

  // Check for existing dataset on mount
  useEffect(() => {
    if (viewMode === "test") {
      setRecentUploads([{ name: "data.csv", size: "71.3 KB", active: true }]);
      return;
    }
    fetch(`${API_BASE_URL}/dataset/status`)
      .then((res) => res.json())
      .then((d) => {
        if (d.exists) {
          setRecentUploads([
            { name: d.filename, size: formatSize(d.size_bytes), active: true },
          ]);
        }
      })
      .catch(() => {});
  }, [viewMode]);

  // Step 1: file selected → parse headers, show metadata form
  const stageFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Only .csv files are supported");
      return;
    }
    setError("");
    const cols = await parseCsvHeaders(file);
    setCsvColumns(cols);
    setTargetColumn(cols[cols.length - 1] ?? "");
    setDescription("");
    setPendingFile(file);
  }, []);

  // Step 2: user fills form and clicks "Start Audit" → upload with metadata
  const submitUpload = useCallback(async () => {
    if (!pendingFile) return;
    setIsUploading(true);
    setError("");

    if (viewMode === "test") {
      setTimeout(() => {
        setRecentUploads((prev) => [
          { name: pendingFile.name, size: formatSize(pendingFile.size), active: true },
          ...prev.map((f) => ({ ...f, active: false })),
        ]);
        data.onUploadComplete?.(pendingFile.name, targetColumn);
        setPendingFile(null);
        setCsvColumns([]);
        setIsUploading(false);
      }, 600);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", pendingFile);
      formData.append("description", description.trim());
      formData.append("target_column", targetColumn.trim());

      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setRecentUploads((prev) => [
          { name: pendingFile.name, size: formatSize(pendingFile.size), active: true },
          ...prev.map((f) => ({ ...f, active: false })),
        ]);
        data.onUploadComplete?.(pendingFile.name, targetColumn);
        setPendingFile(null);
        setCsvColumns([]);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? "Upload failed");
      }
    } catch {
      setError("Backend not reachable");
    } finally {
      setIsUploading(false);
    }
  }, [pendingFile, description, targetColumn, data, viewMode]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (data.isTourMode) return;
      const file = e.dataTransfer.files?.[0];
      if (file) stageFile(file);
    },
    [stageFile, data.isTourMode]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (data.isTourMode) return;
      const file = e.target.files?.[0];
      if (file) stageFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [stageFile, data.isTourMode]
  );

  return (
    <div className="relative w-[320px] rounded-2xl bg-[#15171B] border border-[#1F2228] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-visible">
      {/* ---- Title Bar ---- */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2228]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-on-surface">Upload Dataset</span>
        </div>
        <button className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-[#1F2228] transition-colors cursor-pointer">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* ---- Drop Zone (hidden once file is staged) ---- */}
      {!pendingFile && (
        <div className="p-4">
          <div
            className={`
              relative rounded-xl border-2 border-dashed p-6 flex flex-col items-center gap-3 transition-all duration-200 cursor-pointer
              ${isDragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-[#2A2D35] hover:border-[#3A3D45] bg-[#111317]"}
            `}
            onDragOver={(e) => { e.preventDefault(); if (!data.isTourMode) setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => { if (data.isTourMode) return; inputRef.current?.click(); }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1F2228]">
              <CloudUpload className="w-5 h-5 text-on-surface-variant" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-on-surface">Drag & drop files here</p>
              <p className="text-[11px] text-on-surface-variant mt-1">
                or <span className="text-primary hover:underline cursor-pointer">click to browse</span>
              </p>
            </div>
            <p className="text-[10px] text-on-surface-variant/60">CSV (Max 50MB)</p>
            {error && <p className="text-[10px] text-error font-medium">{error}</p>}
          </div>
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleInputChange} />
        </div>
      )}

      {/* ---- Metadata Form (shown after file is staged) ---- */}
      {pendingFile && (
        <div className="p-4 flex flex-col gap-3">
          {/* File chip */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
            <File className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-[12px] font-medium text-on-surface flex-1 truncate">{pendingFile.name}</span>
            <span className="text-[10px] text-on-surface-variant flex-shrink-0">{formatSize(pendingFile.size)}</span>
            <button
              onClick={() => { setPendingFile(null); setCsvColumns([]); setError(""); }}
              className="text-on-surface-variant hover:text-on-surface text-[11px] flex-shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
              Dataset Description
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Loan application records for credit scoring. Contains demographic and financial features."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg bg-[#111317] border border-[#2A2D35] focus:border-primary/50 outline-none px-3 py-2 text-[12px] text-on-surface placeholder:text-on-surface-variant/50 transition-colors"
            />
          </div>

          {/* Target column */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
              Target Variable
            </label>
            {csvColumns.length > 0 ? (
              <div className="relative">
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="w-full appearance-none rounded-lg bg-[#111317] border border-[#2A2D35] focus:border-primary/50 outline-none px-3 py-2 text-[12px] text-on-surface transition-colors cursor-pointer pr-8"
                >
                  {csvColumns.map((col, i) => (
                    <option key={`${col}-${i}`} value={col}>{col}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant pointer-events-none" />
              </div>
            ) : (
              <input
                type="text"
                placeholder="Column name (e.g. loan_status)"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full rounded-lg bg-[#111317] border border-[#2A2D35] focus:border-primary/50 outline-none px-3 py-2 text-[12px] text-on-surface placeholder:text-on-surface-variant/50 transition-colors"
              />
            )}
          </div>

          {error && <p className="text-[10px] text-error font-medium">{error}</p>}

          {/* Submit */}
          <button
            onClick={submitUpload}
            disabled={isUploading || !targetColumn.trim()}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-[#15171B] text-[12px] font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            {isUploading ? "Uploading…" : "Start Audit"}
          </button>
        </div>
      )}

      {/* ---- Recent Uploads (only when no pending file) ---- */}
      {recentUploads.length > 0 && !pendingFile && (
        <div className="px-4 pb-4">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mb-2.5">Recent Uploads</p>
          <div className="flex flex-col gap-2">
            {recentUploads.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                  f.active ? "bg-secondary/5 border-secondary/20" : "bg-[#111317] border-[#1F2228]"
                }`}
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${f.active ? "bg-secondary/15" : "bg-[#1F2228]"}`}>
                  {f.active ? <Check className="w-3.5 h-3.5 text-primary" /> : <File className="w-3.5 h-3.5 text-on-surface-variant" />}
                </div>
                <span className={`text-[12px] font-medium flex-1 truncate ${f.active ? "text-on-surface" : "text-on-surface-variant"}`} title={f.name}>
                  {f.name}
                </span>
                <span className="text-[10px] text-on-surface-variant flex-shrink-0">{f.size}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-primary !border-[3px] !border-[#15171B] !-right-[7px] !shadow-[0_0_8px_rgba(208,188,255,0.5)]"
      />
    </div>
  );
}

export default memo(UploadNode);
