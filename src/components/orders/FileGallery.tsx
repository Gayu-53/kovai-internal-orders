"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, File as FileIcon, X } from "lucide-react";
import type { OrderFile } from "@/lib/types";

function isImageFile(contentType: string | null): boolean {
  return !!contentType && contentType.startsWith("image/");
}

export function FileGallery({ files }: { files: OrderFile[] }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (files.length === 0) {
    return <p className="text-sm text-ink-muted">No files attached.</p>;
  }

  const images = files.filter((f) => isImageFile(f.content_type) && f.url);
  const documents = files.filter((f) => !isImageFile(f.content_type));

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setLightboxUrl(f.url ?? null)}
              className="relative aspect-square overflow-hidden rounded-xl border border-border bg-paper"
            >
              <Image src={f.url!} alt={f.original_filename ?? "Reference"} fill className="object-cover" />
              {f.is_primary && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-ink">
                  Primary
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((f) => (
            <a
              key={f.id}
              href={f.url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 transition-colors hover:bg-paper"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-dark">
                <FileIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{f.original_filename}</p>
                <p className="text-xs text-ink-muted">{f.content_type || "File"}</p>
              </div>
              <Download className="h-4 w-4 shrink-0 text-ink-muted" />
            </a>
          ))}
        </div>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative h-full max-h-[85vh] w-full max-w-3xl">
            <Image src={lightboxUrl} alt="Reference" fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
