"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchSalesSummary } from "@/lib/api";
import type { SalesSummary } from "@/lib/types";

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function SalesSummaryPage() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchSalesSummary({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    })
      .then(({ summary }) => setSummary(summary))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load sales summary."))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Sales Summary</h1>
      <p className="mb-6 text-sm text-ink-muted">Orders and revenue by day.</p>

      <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-border bg-white p-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-ink-muted">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-lg border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-dark"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-ink-muted">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-lg border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-dark"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
            className="self-end rounded-lg border border-border-strong bg-white px-3 py-2 text-xs font-medium text-ink-muted hover:bg-paper"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-status-pending-text">{error}</p>
      ) : summary ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs text-ink-muted">Total orders</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">
                {summary.totalOrders}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs text-ink-muted">Total sales</p>
              <p className="mt-1 font-display text-2xl font-bold text-brand-dark">
                {formatCurrency(summary.totalSales)}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-paper text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Orders</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-ink-muted">
                      No orders in this range.
                    </td>
                  </tr>
                ) : (
                  summary.rows.map((row) => (
                    <tr key={row.date} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-ink">
                        {formatDateLabel(row.date)}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{row.order_count}</td>
                      <td className="px-4 py-3 text-right font-medium text-ink">
                        {formatCurrency(row.total_sales)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
