"use client";

import { useEffect, useState } from "react";
import { OrderCard } from "@/components/orders/OrderCard";
import { StatsGrid } from "@/components/orders/StatsGrid";
import { SearchBar } from "@/components/ui/SearchBar";
import { StatusFilterBar } from "@/components/ui/StatusFilterBar";
import { CategoryFilterBar } from "@/components/ui/CategoryFilterBar";
import { SizeFilterBar } from "@/components/ui/SizeFilterBar";
import { UrgencyToggle } from "@/components/ui/UrgencyToggle";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  fetchDashboardStats,
  fetchOrderCategories,
  fetchOrders,
  fetchSizes,
} from "@/lib/api";
import type { DashboardStats, Order, ProductionStatus, UrgencyLevel } from "@/lib/types";

export default function ProductionPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);

  const [urgency, setUrgency] = useState<UrgencyLevel | "ALL">("URGENT");
  const [status, setStatus] = useState<ProductionStatus | "ALL">("ALL");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats().then(({ stats }) => setStats(stats)).catch(() => {});
    fetchOrderCategories().then(({ categories }) => setCategories(categories)).catch(() => {});
    fetchSizes().then(({ sizes }) => setSizes(sizes)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchOrders({
      urgency,
      status,
      category_text: category || undefined,
      size: size || undefined,
      search: search || undefined,
      page_size: 50,
    })
      .then(({ orders }) => setOrders(orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [urgency, status, category, size, search]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        Production Dashboard
      </h1>
      <p className="mb-6 text-sm text-ink-muted">
        Everything that needs to be made, urgent orders first.
      </p>

      {stats && <StatsGrid stats={stats} />}

      <div className="my-5 space-y-3">
        <UrgencyToggle value={urgency} onChange={setUrgency} urgentCount={stats?.urgent} />
        <SearchBar value={search} onChange={setSearch} />
        <StatusFilterBar value={status} onChange={setStatus} />
        {categories.length > 0 && (
          <CategoryFilterBar categories={categories} value={category} onChange={setCategory} />
        )}
        {sizes.length > 0 && <SizeFilterBar sizes={sizes} value={size} onChange={setSize} />}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-ink-muted">Loading orders...</p>
      ) : orders.length === 0 ? (
        <EmptyState message={urgency === "URGENT" ? "No urgent orders 🎉" : "No orders found."} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
