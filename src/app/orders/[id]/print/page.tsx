"use client";

import { use, useEffect, useState } from "react";
import { Loader2, Pencil, Printer } from "lucide-react";
import { fetchOrder } from "@/lib/api";
import { DEFAULT_BUSINESS_INFO } from "@/lib/constants";
import type { Order } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function DispatchSlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingFrom, setEditingFrom] = useState(false);

  const [fromName, setFromName] = useState(DEFAULT_BUSINESS_INFO.name);
  const [fromAddress, setFromAddress] = useState(
    DEFAULT_BUSINESS_INFO.address
  );
  const [fromPhone, setFromPhone] = useState(DEFAULT_BUSINESS_INFO.phone);

  useEffect(() => {
    fetchOrder(id)
      .then(({ order }) => setOrder(order))
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Unable to load order."
        )
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8 text-center text-sm text-ink-muted">
        {error ?? "Order not found."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper py-6 print:bg-white print:py-0">
      {/* Buttons - hidden while printing */}
      <div className="mx-auto mb-4 flex max-w-xl items-center justify-between px-4 print:hidden">
        <button
          onClick={() => setEditingFrom((value) => !value)}
          className="flex items-center gap-1.5 rounded-xl border border-border-strong bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
        >
          <Pencil className="h-4 w-4" />
          {editingFrom ? "Done editing" : "Edit From address"}
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-brand-dark hover:text-white"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
      </div>

      {/* Edit FROM details */}
      {editingFrom && (
        <div className="mx-auto mb-4 max-w-xl space-y-2 rounded-xl border border-border bg-white p-4 print:hidden">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            From
          </p>

          <input
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="Business name"
            className="w-full rounded-lg border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-dark"
          />

          <textarea
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            placeholder="Address"
            rows={2}
            className="w-full rounded-lg border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-dark"
          />

          <input
            value={fromPhone}
            onChange={(e) => setFromPhone(e.target.value)}
            placeholder="Phone number"
            className="w-full rounded-lg border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-dark"
          />
        </div>
      )}

      {/* Customer Bill */}
      <div className="mx-auto max-w-xl border border-border bg-white p-8 text-ink print:border-0 print:p-6 print:shadow-none">
        {/* Business / FROM */}
        <div className="mb-6 border-b border-border pb-4">
          <p className="font-display text-lg font-bold tracking-tight text-ink">
            {fromName}
          </p>

          <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">
            {fromAddress}
          </p>

          <p className="mt-1 text-sm text-ink-muted">
            Ph: {fromPhone}
          </p>
        </div>

        {/* Order number and date */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              Order
            </p>

            <p className="font-display text-xl font-bold text-brand-dark">
              {order.order_number}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              Date
            </p>

            <p className="text-sm font-medium text-ink">
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        {/* Customer / Delivery details */}
        <div className="mb-6 rounded-xl border border-border-strong p-4 print:rounded-none">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Deliver to
          </p>

          <p className="whitespace-pre-line text-sm text-ink">
            {order.customer_details}
          </p>
        </div>

        {/* Products */}
        {order.line_items.map((item, i) => (
          <div key={i} className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {order.line_items.length > 1
                ? `Product ${i + 1}`
                : "Order details"}
            </p>

            <table className="w-full text-sm">
              <tbody>
                <tr className="border-t border-border">
                  <td className="py-1.5 pr-3 text-ink-muted">
                    Category
                  </td>

                  <td className="py-1.5 font-medium text-ink">
                    {item.category_text || "—"}
                  </td>
                </tr>

                <tr className="border-t border-border">
                  <td className="py-1.5 pr-3 text-ink-muted">
                    Product
                  </td>

                  <td className="py-1.5 font-medium text-ink">
                    {item.product_text || "—"}
                  </td>
                </tr>

                <tr className="border-t border-border">
                  <td className="py-1.5 pr-3 text-ink-muted">
                    Quantity
                  </td>

                  <td className="py-1.5 font-medium text-ink">
                    {item.quantity}
                  </td>
                </tr>

                {item.size && (
                  <tr className="border-t border-border">
                    <td className="py-1.5 pr-3 text-ink-muted">
                      Size
                    </td>

                    <td className="py-1.5 font-medium text-ink">
                      {item.size}
                    </td>
                  </tr>
                )}

                {item.colour && (
                  <tr className="border-t border-border">
                    <td className="py-1.5 pr-3 text-ink-muted">
                      Colour
                    </td>

                    <td className="py-1.5 font-medium text-ink">
                      {item.colour}
                    </td>
                  </tr>
                )}

                {item.customization_data
                  .filter((field) => field.value?.trim())
                  .map((field, fieldIndex) => (
                    <tr
                      key={fieldIndex}
                      className="border-t border-border"
                    >
                      <td className="py-1.5 pr-3 text-ink-muted">
                        {field.label}
                      </td>

                      <td className="py-1.5 font-medium text-ink">
                        {field.value}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Amount / Payment */}
        <div className="mb-6">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-t border-border">
                <td className="py-1.5 pr-3 text-ink-muted">
                  Amount
                </td>

                <td className="py-1.5 font-medium text-ink">
                  {formatCurrency(order.total_amount)} (
                  {order.payment_status === "PAID"
                    ? "Paid"
                    : "Not Paid"}
                  )
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Urgent */}
        {order.urgency === "URGENT" && (
          <div className="mb-4 rounded-xl border border-status-pending bg-status-pending/10 p-3 text-center text-sm font-bold uppercase tracking-wide text-status-pending-text print:rounded-none">
            Urgent
          </div>
        )}

        <p className="mt-6 text-center text-xs text-ink-faint">
          Thank you for your order!
        </p>
      </div>
    </div>
  );
}