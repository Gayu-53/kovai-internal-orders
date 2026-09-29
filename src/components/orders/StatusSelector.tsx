"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { updateOrderStatusRequest } from "@/lib/api";
import { PRODUCTION_STATUS_CONFIG } from "@/lib/statusConfig";
import type { Order, ProductionStatus } from "@/lib/types";

const STATUS_ORDER: ProductionStatus[] = ["PENDING", "PRODUCTION", "READY", "DISPATCHED", "CANCELLED"];

export function StatusSelector({
  order,
  onUpdated,
}: {
  order: Order;
  onUpdated: (order: Order) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleChange(status: ProductionStatus) {
    if (status === order.production_status) return;
    setSaving(true);
    try {
      const { order: updated } = await updateOrderStatusRequest(order.id, status);
      onUpdated(updated);
      toast.success(`Order ${order.order_number} moved to ${PRODUCTION_STATUS_CONFIG[status].label}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={order.production_status}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as ProductionStatus)}
      className="w-full rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-base font-medium text-ink outline-none transition-colors focus:border-brand-dark disabled:opacity-50"
    >
      {STATUS_ORDER.map((status) => (
        <option key={status} value={status}>
          {PRODUCTION_STATUS_CONFIG[status].label}
        </option>
      ))}
    </select>
  );
}
