"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OrderCard } from "@/components/orders/OrderCard";
import { StatsGrid } from "@/components/orders/StatsGrid";
import { SearchBar } from "@/components/ui/SearchBar";
import { StatusFilterBar } from "@/components/ui/StatusFilterBar";
import { UrgencyToggle } from "@/components/ui/UrgencyToggle";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchDashboardStats, fetchOrders } from "@/lib/api";
import type {
  DashboardStats,
  Order,
  ProductionStatus,
  UrgencyLevel,
} from "@/lib/types";
import { Loader2, Printer, Users } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductionStatus | "ALL">("ALL");
  const [urgency, setUrgency] = useState<UrgencyLevel | "ALL">("ALL");

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  useEffect(() => {
    fetchDashboardStats()
      .then(({ stats }) => setStats(stats))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);

    const timeout = setTimeout(() => {
      fetchOrders({
        status,
        urgency,
        search: search || undefined,
        page_size: 50,
      })
        .then(({ orders }) => {
          setOrders(orders);

          // Remove selections for orders that are no longer visible
          setSelectedOrders((current) =>
            current.filter((id) =>
              orders.some((order) => order.id === id)
            )
          );
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [status, urgency, search]);

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId]
    );
  };

  const allOrdersSelected =
    orders.length > 0 &&
    orders.every((order) => selectedOrders.includes(order.id));

  const toggleSelectAll = () => {
    if (allOrdersSelected) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((order) => order.id));
    }
  };

  const printSelectedAddresses = () => {
    if (selectedOrders.length === 0) return;

    const ids = selectedOrders.join(",");

    window.open(
      `/orders/print-addresses?ids=${encodeURIComponent(ids)}`,
      "_blank"
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        Dashboard
      </h1>

      <p className="mb-5 text-sm text-ink-muted">
        All orders at a glance.
      </p>

      {/* Customer History */}
      <div className="mb-5 flex flex-wrap gap-3">
        <Link
          href="/customers"
          className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brand hover:text-ink"
        >
          <Users className="h-4 w-4" />
          Customer History
        </Link>
      </div>

      {stats && <StatsGrid stats={stats} />}

      <div className="mt-6 space-y-3">
        <SearchBar value={search} onChange={setSearch} />

        <UrgencyToggle
          value={urgency}
          onChange={setUrgency}
          urgentCount={stats?.urgent}
        />

        <StatusFilterBar value={status} onChange={setStatus} />
      </div>

      {!loading && orders.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={allOrdersSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-border-strong"
            />

            <span>
              {allOrdersSelected ? "Deselect All" : "Select All"}
            </span>
          </label>

          <button
            type="button"
            onClick={printSelectedAddresses}
            disabled={selectedOrders.length === 0}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-brand-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />

            {selectedOrders.length > 0
              ? `Print Addresses (${selectedOrders.length})`
              : "Print Addresses"}
          </button>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState message="No orders found." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <div key={order.id} className="relative">
                <label
                  className="absolute left-3 top-3 z-10 flex cursor-pointer items-center gap-2 rounded-lg bg-white px-2 py-1.5 shadow-sm"
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => toggleOrderSelection(order.id)}
                    className="h-4 w-4 rounded border-border-strong"
                  />

                  <span className="text-xs font-medium text-ink">
                    Select
                  </span>
                </label>

                <OrderCard order={order} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}