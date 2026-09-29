import { PAYMENT_STATUS_CONFIG, PRODUCTION_STATUS_CONFIG, URGENCY_CONFIG } from "@/lib/statusConfig";
import type { PaymentStatus, ProductionStatus, UrgencyLevel } from "@/lib/types";

export function ProductionStatusBadge({ status }: { status: ProductionStatus }) {
  const config = PRODUCTION_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = PAYMENT_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.badgeClass}`}
    >
      {config.label}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  if (urgency === "NORMAL") return null;
  const config = URGENCY_CONFIG[urgency];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${config.badgeClass}`}
    >
      {config.label}
    </span>
  );
}
