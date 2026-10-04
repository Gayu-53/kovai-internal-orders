"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Search, Users } from "lucide-react";
import { fetchOrders } from "@/lib/api";
import type { Order } from "@/lib/types";

function extractCustomerName(customerDetails: string) {
  if (!customerDetails) return "Unknown Customer";

  const lines = customerDetails
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const nameLine = lines.find((line) => /name\s*:/i.test(line));

  if (nameLine) {
    return nameLine.replace(/^.*name\s*:\s*/i, "").trim();
  }

  return lines[0]
    .replace(/^customer\s*:\s*/i, "")
    .replace(/^name\s*:\s*/i, "")
    .trim();
}

function extractPhoneNumber(customerDetails: string) {
  if (!customerDetails) return "";

  const matches = customerDetails.match(
    /(?:\+91|91|0)?[\s-]?[6-9]\d{9}/g
  );

  if (!matches?.length) return "";

  const digits = matches[0].replace(/\D/g, "");

  if (digits.length === 10) return digits;

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  return digits;
}

function formatCurrency(value: number | string | null | undefined) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function CustomersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOrders({
      status: "ALL",
      urgency: "ALL",
      page_size: 100,
    })
      .then(({ orders }) => setOrders(orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const customers = useMemo(() => {
    const grouped = new Map<
      string,
      {
        name: string;
        phone: string;
        orders: Order[];
        totalSpent: number;
      }
    >();

    orders.forEach((order) => {
      const details = order.customer_details || "";
      const name = extractCustomerName(details);
      const phone = extractPhoneNumber(details);
      const key = phone || name.toLowerCase();

      if (!key) return;

      const existing = grouped.get(key);

      if (existing) {
        existing.orders.push(order);
        existing.totalSpent += Number(order.total_amount || 0);
      } else {
        grouped.set(key, {
          name,
          phone,
          orders: [order],
          totalSpent: Number(order.total_amount || 0),
        });
      }
    });

    return Array.from(grouped.entries()).map(([key, customer]) => ({
      key,
      ...customer,
    }));
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.includes(query)
    );
  }, [customers, search]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand">
          <Users className="h-5 w-5 text-ink" />
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Customer History
          </h1>

          <p className="text-sm text-ink-muted">
            Search and view previous customer orders.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name or phone..."
            className="w-full rounded-xl border border-border py-3 pl-10 pr-4 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-3 font-semibold text-ink">
            No customers found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredCustomers.map((customer) => (
            <Link
              key={customer.key}
              href={`/customers/${encodeURIComponent(
                customer.phone || customer.key
              )}`}
              className="rounded-xl border border-border bg-white p-5 transition hover:border-brand hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-ink">
                    {customer.name}
                  </h2>

                  {customer.phone && (
                    <p className="mt-1 text-sm text-ink-muted">
                      📞 {customer.phone}
                    </p>
                  )}
                </div>

                <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold">
                  View
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-xs text-ink-muted">Orders</p>
                  <p className="mt-1 text-lg font-bold text-ink">
                    {customer.orders.length}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-ink-muted">Total Spent</p>
                  <p className="mt-1 text-lg font-bold text-ink">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}