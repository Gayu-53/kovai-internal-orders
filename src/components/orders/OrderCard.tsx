import Link from "next/link";
import type { Order } from "@/lib/types";
import {
  ProductionStatusBadge,
  PaymentStatusBadge,
  UrgencyBadge,
} from "@/components/ui/StatusBadge";

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function summarizeLineItem(item: Order["line_items"][number]): string {
  const customLines = item.customization_data
    .filter((f) => f.value && f.value.trim().length > 0)
    .map((f) => `${f.label}: ${f.value}`);

  const parts = [item.product_text];

  if (item.size) parts.push(`Size: ${item.size}`);
  if (item.colour) parts.push(`Colour: ${item.colour}`);

  parts.push(`Qty: ${item.quantity}`);

  if (customLines.length > 0) {
    parts.push(...customLines);
  }

  return parts.filter(Boolean).join(" · ");
}

export function OrderCard({ order }: { order: Order }) {
  const isUrgent = order.urgency === "URGENT";

  return (
    <Link
      href={`/orders/${order.id}`}
      className={`block overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        isUrgent
          ? "border-status-pending/50 ring-1 ring-status-pending/30"
          : "border-border"
      }`}
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="font-display text-base font-bold tracking-tight text-ink">
          {order.order_number}
        </span>

        <div className="flex items-center gap-2">
          <UrgencyBadge urgency={order.urgency} />
          <ProductionStatusBadge status={order.production_status} />
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="space-y-1.5">
          {order.line_items.map((item, i) => (
            <p key={i} className="text-sm text-ink">
              <span className="font-medium">
                {item.category_text}
              </span>

              {item.product_text &&
                ` — ${summarizeLineItem(item)}`}
            </p>
          ))}

          {order.line_items.length === 0 && (
            <p className="text-sm text-ink-faint">
              No products added
            </p>
          )}
        </div>

        <div className="h-px bg-border" />

        <p className="line-clamp-2 text-sm text-ink">
          {order.customer_details}
        </p>

        <div className="flex items-center justify-between pt-1">
          <span className="font-display text-base font-bold text-ink">
            {formatCurrency(order.total_amount)}
          </span>

          <PaymentStatusBadge
            status={order.payment_status}
          />
        </div>
      </div>
    </Link>
  );
}