"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Phone, User } from "lucide-react";
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

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = use(params);

  const customerPhone = decodeURIComponent(phone);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders({
      status: "ALL",
      urgency: "ALL",
      page_size: 100,
    })
      .then(({ orders }) => {
        const matchingOrders = orders.filter((order) => {
          const orderPhone = extractPhoneNumber(
            order.customer_details || ""
          );

          return orderPhone === customerPhone;
        });

        setOrders(matchingOrders);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [customerPhone]);

  const customerName = useMemo(() => {
    if (orders.length === 0) return "Customer";

    return extractCustomerName(
      orders[0].customer_details || ""
    );
  }, [orders]);

  const totalSpent = useMemo(() => {
    return orders.reduce(
      (total, order) => total + Number(order.total_amount || 0),
      0
    );
  }, [orders]);

  const latestOrder = useMemo(() => {
    return [...orders].sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )[0];
  }, [orders]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/customers"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-10 text-center">
          <User className="mx-auto h-8 w-8 text-ink-faint" />

          <h2 className="mt-3 font-semibold text-ink">
            Customer not found
          </h2>

          <p className="mt-1 text-sm text-ink-muted">
            No orders were found for this customer.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-white p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand">
                  <User className="h-7 w-7 text-ink" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-ink">
                    {customerName}
                  </h1>

                  <p className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
                    <Phone className="h-4 w-4" />
                    {customerPhone}
                  </p>
                </div>
              </div>

              <a
                href={`tel:${customerPhone}`}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
              >
                Call Customer
              </a>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-3">
              <div>
                <p className="text-xs text-ink-muted">
                  Total Orders
                </p>

                <p className="mt-1 text-xl font-bold text-ink">
                  {orders.length}
                </p>
              </div>

              <div>
                <p className="text-xs text-ink-muted">
                  Total Spent
                </p>

                <p className="mt-1 text-xl font-bold text-ink">
                  {formatCurrency(totalSpent)}
                </p>
              </div>

              <div>
                <p className="text-xs text-ink-muted">
                  Last Order
                </p>

                <p className="mt-1 text-xl font-bold text-ink">
                  {formatDate(latestOrder?.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="mb-4 text-lg font-bold text-ink">
              Order History
            </h2>

            <div className="space-y-3">
              {[...orders]
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block rounded-xl border border-border bg-white p-5 transition hover:border-brand hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-bold text-ink">
                          #{order.order_number}
                        </p>

                        <p className="mt-1 text-sm text-ink-muted">
                          {formatDate(order.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-bold text-ink">
                          {formatCurrency(order.total_amount)}
                        </span>

                        <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-ink">
                          {order.production_status}
                        </span>

                        <span className="text-xs font-medium text-ink-muted">
                          View Order →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}