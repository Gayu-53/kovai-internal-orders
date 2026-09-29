"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import { uploadOrderFile } from "@/lib/api";
import { validateOrderFile } from "@/lib/validation";
import type { OrderFile } from "@/lib/types";

export function FileUploader({
  orderId,
  onUploaded,
}: {
  orderId: string;
  onUploaded: (file: OrderFile) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);

    for (const file of Array.from(fileList)) {
      const validationError = validateOrderFile(file);
      if (validationError) {
        toast.error(validationError);
        continue;
      }
      try {
        const { file: uploaded } = await uploadOrderFile(orderId, file);
        onUploaded(uploaded);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "File upload failed. Please try again.");
      }
    }

    setUploading(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-strong px-4 py-3 text-sm font-medium text-brand-dark transition-colors hover:border-brand-dark hover:bg-brand-tint/40 disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
        {uploading ? "Uploading..." : "Add files"}
      </button>
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
    </div>
  );
}
