import type { ProductionStatus } from "@/lib/types";
import { PRODUCTION_STATUS_CONFIG } from "@/lib/statusConfig";

const OPTIONS: { key: ProductionStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: PRODUCTION_STATUS_CONFIG.PENDING.label },
  { key: "PRODUCTION", label: PRODUCTION_STATUS_CONFIG.PRODUCTION.label },
  { key: "READY", label: PRODUCTION_STATUS_CONFIG.READY.label },
  { key: "DISPATCHED", label: PRODUCTION_STATUS_CONFIG.DISPATCHED.label },
];

export function StatusFilterBar({
  value,
  onChange,
}: {
  value: ProductionStatus | "ALL";
  onChange: (value: ProductionStatus | "ALL") => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === opt.key
              ? "border-brand-dark bg-brand text-ink"
              : "border-border-strong bg-white text-ink-muted hover:bg-paper"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
