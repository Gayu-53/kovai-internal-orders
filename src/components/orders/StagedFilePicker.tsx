"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { File as FileIcon, Loader2, Star, Trash2, UploadCloud, X } from "lucide-react";
import toast from "react-hot-toast";
import { validateOrderFile } from "@/lib/validation";

export interface StagedFile {
  localId: string;
  file: File;
  previewUrl: string | null; // only set for image files
  status: "ready" | "error";
  error?: string;
}

interface StagedFilePickerProps {
  files: StagedFile[];
  onFilesChange: (files: StagedFile[]) => void;
  primaryLocalId: string | null;
  onPrimaryChange: (localId: string | null) => void;
}

function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Accepts ANY file type — photos, PDFs, Word documents, anything the
 * customer sends. This is deliberate: an order can come in as a photo
 * reference OR as a submitted document (e.g. a photo-frame design sent as
 * a PDF), and both should save and stay attached to the order exactly as
 * uploaded, the way a resume attaches to a job application — not forced
 * through an image-only pipeline.
 */
export function StagedFilePicker({
  files,
  onFilesChange,
  primaryLocalId,
  onPrimaryChange,
}: StagedFilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const incoming = Array.from(fileList);
      const newItems: StagedFile[] = incoming.map((file) => {
        const validationError = validateOrderFile(file);
        return {
          localId: crypto.randomUUID(),
          file,
          previewUrl: isImage(file) ? URL.createObjectURL(file) : null,
          status: validationError ? "error" : "ready",
          error: validationError ?? undefined,
        };
      });

      newItems.forEach((item) => {
        if (item.error) toast.error(item.error);
      });

      const next = [...filesRef.current, ...newItems];
      filesRef.current = next;
      onFilesChange(next);

      if (!primaryLocalId) {
        const firstReady = newItems.find((i) => i.status === "ready");
        if (firstReady) onPrimaryChange(firstReady.localId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [primaryLocalId]
  );

  function handleRemove(localId: string) {
    const target = files.find((f) => f.localId === localId);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    const remaining = files.filter((f) => f.localId !== localId);
    filesRef.current = remaining;
    onFilesChange(remaining);
    if (primaryLocalId === localId) {
      onPrimaryChange(remaining.find((f) => f.status === "ready")?.localId ?? null);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
          dragActive
            ? "border-brand-dark bg-brand-tint"
            : "border-border-strong bg-paper hover:border-brand-dark hover:bg-brand-tint/40"
        }`}
      >
        <UploadCloud className="h-8 w-8 text-brand-dark" />
        <p className="text-sm font-medium text-ink">
          Drop files here, or tap to choose files
        </p>
        <p className="text-xs text-ink-muted">
          Photos, PDFs, Word documents — any file type, as many as you need
        </p>
      </div>

      {/* No accept= restriction: any file type is allowed, per requirement */}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f) => (
            <div
              key={f.localId}
              className="flex items-center gap-3 rounded-xl border border-border bg-white p-2.5"
            >
              {f.previewUrl ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-paper">
                  <Image src={f.previewUrl} alt={f.file.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-paper text-ink-muted">
                  <FileIcon className="h-5 w-5" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{f.file.name}</p>
                <p className="text-xs text-ink-muted">{formatFileSize(f.file.size)}</p>
                {f.error && <p className="text-xs text-status-pending-text">{f.error}</p>}
              </div>

              {f.status === "error" ? (
                <Loader2 className="hidden" />
              ) : (
                <button
                  type="button"
                  onClick={() => onPrimaryChange(f.localId)}
                  title="Set as primary"
                  className="shrink-0 rounded-full p-1.5 text-ink-muted transition-colors hover:bg-brand-tint hover:text-brand-dark"
                >
                  <Star
                    className={`h-4 w-4 ${f.localId === primaryLocalId ? "fill-brand-dark text-brand-dark" : ""}`}
                  />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleRemove(f.localId)}
                className="shrink-0 rounded-full p-1.5 text-ink-muted transition-colors hover:bg-status-pending/10 hover:text-status-pending-text"
              >
                {f.error ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
