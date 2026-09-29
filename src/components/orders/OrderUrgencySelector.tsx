"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { updateOrderUrgencyRequest } from "@/lib/api";
import type { Order, UrgencyLevel } from "@/lib/types";

export function OrderUrgencySelector({
  order,
  onUpdated,
}: {
  order: Order;
  onUpdated: (order: Order) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleChange(urgency: UrgencyLevel) {
    if (urgency === order.urgency) return;
    setSaving(true);
    try {
      const { order: updated } = await updateOrderUrgencyRequest(order.id, urgency);
      onUpdated(updated);
      toast.success(
        urgency === "URGENT"
          ? `Order ${order.order_number} marked urgent.`
          : `Order ${order.order_number} marked normal.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update urgency.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={saving}
        onClick={() => handleChange("NORMAL")}
        className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
          order.urgency === "NORMAL"
            ? "border-brand-dark bg-brand text-ink"
            : "border-border-strong bg-white text-ink-muted hover:bg-paper"
        }`}
      >
        Normal
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={() => handleChange("URGENT")}
        className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
          order.urgency === "URGENT"
            ? "border-status-pending bg-status-pending text-white"
            : "border-border-strong bg-white text-ink-muted hover:bg-paper"
        }`}
      >
        Urgent
      </button>
    </div>
  );
}
