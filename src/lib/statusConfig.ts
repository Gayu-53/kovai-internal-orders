import type { ProductionStatus, PaymentStatus, UrgencyLevel } from "./types";

interface StatusVisual {
  label: string;
  dotClass: string;
  badgeClass: string;
}

export const PRODUCTION_STATUS_CONFIG: Record<ProductionStatus, StatusVisual> = {
  PENDING: {
    label: "Pending",
    dotClass: "bg-status-pending",
    badgeClass: "bg-status-pending/15 text-status-pending-text border-status-pending/30",
  },
  PRODUCTION: {
    label: "In Production",
    dotClass: "bg-status-production",
    badgeClass:
      "bg-status-production/15 text-status-production-text border-status-production/30",
  },
  READY: {
    label: "Ready",
    dotClass: "bg-status-ready",
    badgeClass: "bg-status-ready/15 text-status-ready-text border-status-ready/30",
  },
  DISPATCHED: {
    label: "Dispatched",
    dotClass: "bg-status-dispatched",
    badgeClass:
      "bg-status-dispatched/15 text-status-dispatched-text border-status-dispatched/30",
  },
  CANCELLED: {
    label: "Cancelled",
    dotClass: "bg-neutral-400",
    badgeClass: "bg-neutral-200 text-neutral-600 border-neutral-300",
  },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusVisual> = {
  PAID: {
    label: "Paid",
    dotClass: "bg-status-ready",
    badgeClass: "bg-status-ready/15 text-status-ready-text border-status-ready/30",
  },
  NOT_PAID: {
    label: "Not Paid",
    dotClass: "bg-status-pending",
    badgeClass: "bg-status-pending/15 text-status-pending-text border-status-pending/30",
  },
};

export const URGENCY_CONFIG: Record<UrgencyLevel, StatusVisual> = {
  URGENT: {
    label: "Urgent",
    dotClass: "bg-status-pending",
    badgeClass: "bg-status-pending text-white border-status-pending",
  },
  NORMAL: {
    label: "Normal",
    dotClass: "bg-ink-faint",
    badgeClass: "bg-paper text-ink-muted border-border-strong",
  },
};
