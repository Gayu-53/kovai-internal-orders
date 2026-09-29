"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Pencil, Printer } from "lucide-react";
import { fetchOrder } from "@/lib/api";
import { DEFAULT_BUSINESS_INFO } from "@/lib/constants";
import type { Order } from "@/lib/types";

export default function PrintAddressesPage() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingFrom, setEditingFrom] = useState(false);

  const [fromName, setFromName] = useState(DEFAULT_BUSINESS_INFO.name);
  const [fromAddress, setFromAddress] = useState(
    DEFAULT_BUSINESS_INFO.address
  );
  const [fromPhone, setFromPhone] = useState(DEFAULT_BUSINESS_INFO.phone);

  useEffect(() => {
    if (!idsParam) {
      setError("No orders were selected.");
      setLoading(false);
      return;
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      setError("No orders were selected.");
      setLoading(false);
      return;
    }

    Promise.all(
      ids.map(async (id) => {
        const result = await fetchOrder(id);
        return result.order;
      })
    )
      .then((fetchedOrders) => {
        setOrders(fetchedOrders);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load selected orders."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [idsParam]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
      </div>
    );
  }

  if (error || orders.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="text-center">
          <p className="text-sm text-ink-muted">
            {error ?? "No orders found."}
          </p>
        </div>
      </div>
    );
  }

  // Split orders into groups of 4.
  const sheets: Order[][] = [];

  for (let i = 0; i < orders.length; i += 4) {
    sheets.push(orders.slice(i, i + 4));
  }

  return (
    <div className="min-h-screen bg-paper py-6 print:bg-white print:py-0">
      {/* Controls */}
      <div className="mx-auto mb-4 flex max-w-xl items-center justify-between px-4 print:hidden">
        <button
          type="button"
          onClick={() => setEditingFrom((value) => !value)}
          className="flex items-center gap-1.5 rounded-xl border border-border-strong bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
        >
          <Pencil className="h-4 w-4" />

          {editingFrom ? "Done editing" : "Edit From address"}
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-brand-dark hover:text-white"
        >
          <Printer className="h-4 w-4" />
          Print {orders.length} Address{orders.length === 1 ? "" : "es"}
        </button>
      </div>

      {/* Edit From */}
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

      {/* A4 sheets */}
      <div className="mx-auto">
        {sheets.map((sheet, sheetIndex) => (
          <div
            key={sheetIndex}
            className="mx-auto grid h-[297mm] w-[210mm] grid-cols-2 grid-rows-2 bg-white print:h-[297mm] print:w-[210mm]"
            style={{
              pageBreakAfter:
                sheetIndex < sheets.length - 1 ? "always" : "auto",
            }}
          >
            {sheet.map((order) => (
              <div
                key={order.id}
                className="flex h-full w-full flex-col border border-black p-6"
              >
                {/* FROM */}
                <div className="mb-5 border-b border-border pb-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                    From
                  </p>

                  <p className="font-display text-base font-bold tracking-tight text-ink">
                    {fromName}
                  </p>

                  <p className="mt-1 whitespace-pre-line text-xs leading-5 text-ink-muted">
                    {fromAddress}
                  </p>

                  <p className="mt-1 text-xs text-ink-muted">
                    Ph: {fromPhone}
                  </p>
                </div>

                {/* TO */}
                <div className="flex flex-1 flex-col">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                    To
                  </p>

                  <div className="flex-1 rounded-xl border-2 border-border-strong p-4">
                    <p className="whitespace-pre-line text-sm font-medium leading-6 text-ink">
                      {order.customer_details}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty boxes for incomplete final sheet */}
            {Array.from({ length: 4 - sheet.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="border border-transparent"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}