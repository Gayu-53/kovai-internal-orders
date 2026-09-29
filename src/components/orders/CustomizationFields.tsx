"use client";

import { Plus, Trash2 } from "lucide-react";
import type { CustomField } from "@/lib/types";

const SUGGESTED_LABELS = ["Size", "Colour", "Theme", "Material", "Font", "Design", "Other"];

export function CustomizationFields({
  fields,
  onChange,
}: {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}) {
  function addField(label = "") {
    onChange([...fields, { label, value: "" }]);
  }

  function updateField(index: number, patch: Partial<CustomField>) {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  const usedLabels = new Set(fields.map((f) => f.label.trim().toLowerCase()));
  const availableSuggestions = SUGGESTED_LABELS.filter(
    (label) => !usedLabels.has(label.toLowerCase())
  );

  return (
    <div>
      {fields.length === 0 && (
        <p className="mb-3 text-sm text-ink-muted">
          Add whatever details this order needs — size, colour, theme, anything at all.
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,140px)_1fr]">
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                placeholder="Heading (e.g. Size)"
                className="w-full rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand-dark"
              />
              <input
                type="text"
                value={field.value}
                onChange={(e) => updateField(index, { value: e.target.value })}
                placeholder="Value (e.g. 12 inch)"
                className="w-full rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand-dark"
              />
            </div>
            <button
              type="button"
              onClick={() => removeField(index)}
              aria-label={`Remove ${field.label || "field"}`}
              className="mt-1 rounded-lg p-2 text-ink-muted transition-colors hover:bg-status-pending/10 hover:text-status-pending-text"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => addField()}
        className="mt-3 flex items-center gap-1.5 rounded-xl border border-dashed border-border-strong px-3.5 py-2.5 text-sm font-medium text-brand-dark transition-colors hover:border-brand-dark hover:bg-brand-tint/40"
      >
        <Plus className="h-4 w-4" />
        Add field
      </button>

      {availableSuggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-xs text-ink-muted">Quick add:</span>
          {availableSuggestions.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => addField(label)}
              className="rounded-full border border-border-strong px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-brand-dark hover:text-brand-dark"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
