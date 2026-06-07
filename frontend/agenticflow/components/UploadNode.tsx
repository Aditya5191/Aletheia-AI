"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { API_BASE_URL } from "../lib/config";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import {
  Upload,
  FileSpreadsheet,
  Check,
  Loader2,
  MoreHorizontal,
  CloudUpload,
  File,
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
  onUploadComplete?: (fileName: string) => void;
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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Check for existing dataset on mount (skip in test-developer mode)
  useEffect(() => {
    if (viewMode === "test-developer") {
      setRecentUploads([{ name: "data.csv", size: "71.3 KB", active: true }]);
      return;
    }
    fetch(`${API_BASE_URL}/dataset/status`)
      .then((res) => res.json())
      .then((data) => {
        if (data.exists) {
          setRecentUploads([
            {
              name: data.filename,
              size: formatSize(data.size_bytes),
              active: true,
            },
          ]);
        }
      })
      .catch(() => {
        // Backend not reachable yet — that's fine
      });
  }, [viewMode]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".csv")) {
        setError("Only .csv files are supported");
        return;
      }

      setError("");
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const newFile: UploadedFile = {
            name: file.name,
            size: formatSize(file.size),
            active: true,
          };
          setRecentUploads((prev) => [
            newFile,
            ...prev.map((f) => ({ ...f, active: false })),
          ]);
          data.onUploadComplete?.(file.name);
        } else {
          setError("Upload failed");
        }
      } catch {
        setError("Backend not reachable");
      } finally {
        setIsUploading(false);
      }
    },
    [data]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (data.isTourMode) return;

      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile, data.isTourMode]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (data.isTourMode) return;
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile, data.isTourMode]
  );

  return (
    <div className="relative w-[320px] rounded-2xl bg-surface border border-outline-variant shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-visible">
      {/* ---- Title Bar ---- */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-on-surface">
            Upload Dataset
          </span>
        </div>
        <button className="w-7 h-7 flex items-center justify-center rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* ---- Drop Zone ---- */}
      <div className="p-4">
        <div
          className={`
            relative rounded-xl border-2 border-dashed p-6 flex flex-col items-center gap-3 transition-all duration-200 cursor-pointer
            ${
              isDragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : isUploading
                ? "border-primary/40 bg-primary/5"
                : "border-[#2A2D35] hover:border-[#3A3D45] bg-surface-lowest"
            }
          `}
          onDragOver={(e) => {
            e.preventDefault();
            if (!data.isTourMode) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (data.isTourMode) return;
            if (!isUploading) inputRef.current?.click();
          }}
        >
          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isUploading ? "bg-primary/15" : "bg-surface-container"
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <CloudUpload className="w-5 h-5 text-outline" />
            )}
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="text-[13px] font-medium text-on-surface">
              {isUploading ? "Uploading..." : "Drag & drop files here"}
            </p>
            {!isUploading && (
              <p className="text-[11px] text-outline mt-1">
                or{" "}
                <span className="text-primary hover:underline cursor-pointer">
                  click to browse
                </span>
              </p>
            )}
          </div>

          {/* Format info */}
          {!isUploading && (
            <p className="text-[10px] text-outline/60">CSV (Max 50MB)</p>
          )}

          {/* Error */}
          {error && (
            <p className="text-[10px] text-tertiary font-medium">{error}</p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* ---- Recent Uploads ---- */}
      {recentUploads.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-[10px] text-outline uppercase tracking-widest font-semibold mb-2.5">
            Recent Uploads
          </p>
          <div className="flex flex-col gap-2">
            {recentUploads.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                  f.active
                    ? "bg-secondary/5 border-secondary/20"
                    : "bg-surface-lowest border-outline-variant"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                    f.active ? "bg-secondary/15" : "bg-surface-container"
                  }`}
                >
                  {f.active ? (
                    <Check className="w-3.5 h-3.5 text-secondary" />
                  ) : (
                    <File className="w-3.5 h-3.5 text-outline" />
                  )}
                </div>
                <span
                  className={`text-[12px] font-medium flex-1 truncate ${
                    f.active ? "text-on-surface" : "text-outline"
                  }`}
                  title={f.name}
                >
                  {f.name}
                </span>
                <span className="text-[10px] text-outline flex-shrink-0">
                  {f.size}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-primary !border-[3px] !border-[var(--color-surface)] !-right-[7px] !shadow-[0_0_8px_rgba(208,188,255,0.5)]"
      />
    </div>
  );
}

export default memo(UploadNode);
