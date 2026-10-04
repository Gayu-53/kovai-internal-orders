"use client";

import { useState } from "react";
import JSZip from "jszip";
import {
  Download,
  ExternalLink,
  File as FileIcon,
  Loader2,
} from "lucide-react";

type OrderFile = {
  id: string;
  url: string | null;
  original_filename: string | null;
  content_type: string | null;
};

type OrderFilesProps = {
  files?: OrderFile[];
  orderNumber?: string;
};

function isImageFile(contentType: string | null): boolean {
  return !!contentType && contentType.startsWith("image/");
}

export default function OrderFiles({
  files = [],
  orderNumber = "order",
}: OrderFilesProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  async function downloadFile(file: OrderFile) {
    if (!file.url) {
      alert("File is not available.");
      return;
    }

    try {
      setDownloadingId(file.id);

      const response = await fetch(file.url);

      if (!response.ok) {
        throw new Error("Failed to download file.");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.original_filename || "download";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download error:", error);
      alert("Unable to download this file.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function downloadAllFiles() {
    if (files.length === 0) return;

    try {
      setDownloadingAll(true);

      const zip = new JSZip();

      for (let index = 0; index < files.length; index++) {
        const file = files[index];

        if (!file.url) continue;

        const response = await fetch(file.url);

        if (!response.ok) {
          throw new Error(
            `Unable to download ${
              file.original_filename || `file-${index + 1}`
            }`,
          );
        }

        const blob = await response.blob();

        const filename =
          file.original_filename || `file-${index + 1}`;

        zip.file(filename, blob);
      }

      const zipBlob = await zip.generateAsync({
        type: "blob",
      });

      const zipUrl = window.URL.createObjectURL(zipBlob);

      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = `${orderNumber}-files.zip`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(zipUrl);
    } catch (error) {
      console.error("Download all error:", error);
      alert("Unable to download all files.");
    } finally {
      setDownloadingAll(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Customer Files
          </h2>

          <p className="mt-1 text-sm text-ink-muted">
            {files.length === 0
              ? "No files uploaded"
              : `${files.length} file${
                  files.length === 1 ? "" : "s"
                } uploaded`}
          </p>
        </div>

        {files.length > 1 && (
          <button
            type="button"
            onClick={downloadAllFiles}
            disabled={downloadingAll}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloadingAll ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download All
              </>
            )}
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-paper p-6 text-center text-sm text-ink-muted">
          No customer files were uploaded for this order.
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file, index) => {
            const filename =
              file.original_filename ||
              `file-${index + 1}`;

            const image =
              file.url &&
              isImageFile(file.content_type);

            return (
              <div
                key={file.id}
                className="overflow-hidden rounded-xl border border-border bg-white"
              >
                {image && (
                  <div className="flex justify-center bg-paper p-3">
                    <img
                      src={file.url!}
                      alt={filename}
                      className="max-h-72 w-auto max-w-full rounded-lg object-contain"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 p-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-paper">
                    <FileIcon className="h-5 w-5 text-ink-muted" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium text-ink"
                      title={filename}
                    >
                      {filename}
                    </p>

                    <p className="mt-1 text-xs text-ink-muted">
                      {file.content_type || "File"}
                    </p>
                  </div>

                  {file.url ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-paper"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </a>

                      <button
                        type="button"
                        onClick={() => downloadFile(file)}
                        disabled={
                          downloadingId === file.id
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingId === file.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Download
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-faint">
                      File unavailable
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}