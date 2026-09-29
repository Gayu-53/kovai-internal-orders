import type { UrgencyLevel } from "@/lib/types";

interface UrgencyToggleProps {
  value: UrgencyLevel | "ALL";
  onChange: (value: UrgencyLevel | "ALL") => void;
  urgentCount?: number;
}

/**
 * Lets the production team switch between viewing Urgent orders and Normal
 * orders (or All), rather than one mixed list. This is the core feature
 * this app was built for — production staff tap "Urgent" to see only what
 * needs to jump the queue.
 */
export function UrgencyToggle({ value, onChange, urgentCount }: UrgencyToggleProps) {
  const options: { key: UrgencyLevel | "ALL"; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "URGENT", label: "Urgent" },
    { key: "NORMAL", label: "Normal" },
  ];

  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = value === opt.key;
        const isUrgentOption = opt.key === "URGENT";
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? isUrgentOption
                  ? "border-status-pending bg-status-pending text-white"
                  : "border-brand-dark bg-brand text-ink"
                : "border-border-strong bg-white text-ink-muted hover:bg-paper"
            }`}
          >
            {opt.label}
            {opt.key === "URGENT" && typeof urgentCount === "number" && urgentCount > 0 && (
              <span
                className={`rounded-full px-1.5 text-xs ${
                  active ? "bg-white/25" : "bg-status-pending/15 text-status-pending-text"
                }`}
              >
                {urgentCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
