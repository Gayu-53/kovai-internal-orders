"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Pencil,
  Printer,
  X,
} from "lucide-react";
import OrderFiles from "@/components/orders/OrderFiles";
import { FileUploader } from "@/components/orders/FileUploader";
import { StatusSelector } from "@/components/orders/StatusSelector";
import { OrderUrgencySelector } from "@/components/orders/OrderUrgencySelector";
import { DispatchForm } from "@/components/orders/DispatchForm";
import {
  LineItemsEditor,
  type EditableLineItem,
} from "@/components/orders/LineItemsEditor";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { PaymentStatusBadge } from "@/components/ui/StatusBadge";
import { fetchOrder, updateOrderRequest } from "@/lib/api";
import type { Order, PaymentStatus } from "@/lib/types";
import toast from "react-hot-toast";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Finds an Indian phone number from the free-form customer details.
 */
function extractPhoneNumber(customerDetails: string): string | null {
  const matches = customerDetails.match(/\+?\d[\d\s-]{8,}\d/g) ?? [];

  for (const match of matches) {
    const digits = match.replace(/\D/g, "");

    // Normal 10-digit Indian mobile number
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      return `91${digits}`;
    }

    // Indian number already containing 91
    if (digits.length === 12 && digits.startsWith("91")) {
      return digits;
    }

    // 091 + 10 digit mobile number
    if (digits.length === 13 && digits.startsWith("091")) {
      return digits.slice(1);
    }
  }

  return null;
}

function getNotificationMessage(order: Order): string {
  const orderNumber = order.order_number;

  switch (order.production_status) {
    case "PRODUCTION":
      return `✨ Your order ${orderNumber} is now in production!

Our team has started working on your order with care. ❤️

We’ll keep you updated once it is ready.

Thank you for choosing us!`;

    case "READY":
      return `🎁 Good news! Your order ${orderNumber} is ready!

Thank you so much for your patience and for choosing us. ❤️

We’ll update you once your order has been dispatched.`;

    case "DISPATCHED":
      return `💕 Thank you for ordering with us!

Your order ${orderNumber} has been dispatched successfully. 📦✨

It will reach you within 2–5 days.

Thank you for your support and for choosing us! ❤️`;

    case "PENDING":
    default:
      return `🎉 Thank you for your order!

Your order ${orderNumber} has been successfully confirmed. ❤️

We’re happy to create something special for you.

We’ll keep you updated as your order moves through production.

Thank you for choosing us!`;
  }
}

function getNotificationLabel(order: Order): string {
  switch (order.production_status) {
    case "PRODUCTION":
      return "Notify Customer — Production Started";

    case "READY":
      return "Notify Customer — Ready";

    case "DISPATCHED":
      return "Notify Customer — Dispatched";

    case "PENDING":
    default:
      return "Notify Customer — Order Confirmed";
  }
}

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [customerDetails, setCustomerDetails] = useState("");
  const [editLineItems, setEditLineItems] = useState<EditableLineItem[]>([]);
  const [lineItemErrors, setLineItemErrors] = useState<
    Record<number, { categoryText?: string; productText?: string }>
  >({});
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("NOT_PAID");

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

  function startEditing(order: Order) {
    setCustomerDetails(order.customer_details);

    setEditLineItems(
      order.line_items.map((item) => ({
        category_text: item.category_text,
        product_text: item.product_text,
        quantity: String(item.quantity),
        size: item.size ?? "",
        colour: item.colour ?? "",
        customization_data: item.customization_data,
      }))
    );

    setLineItemErrors({});
    setAmount(
      order.total_amount !== null ? String(order.total_amount) : ""
    );
    setPaymentStatus(order.payment_status);
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!order) return;

    const nextLineItemErrors: Record<
      number,
      { categoryText?: string; productText?: string }
    > = {};

    editLineItems.forEach((item, index) => {
      const itemErrors: {
        categoryText?: string;
        productText?: string;
      } = {};

      if (!item.category_text.trim()) {
        itemErrors.categoryText = "Category is required.";
      }

      if (!item.product_text.trim()) {
        itemErrors.productText = "Product is required.";
      }

      if (Object.keys(itemErrors).length > 0) {
        nextLineItemErrors[index] = itemErrors;
      }
    });

    if (
      !customerDetails.trim() ||
      Object.keys(nextLineItemErrors).length > 0
    ) {
      setLineItemErrors(nextLineItemErrors);

      toast.error(
        "Customer details and every product's category/product are required."
      );

      return;
    }

    setSaving(true);

    try {
      const { order: updated } = await updateOrderRequest(order.id, {
        customer_details: customerDetails.trim(),

        line_items: editLineItems.map((item) => ({
          category_text: item.category_text.trim(),
          product_text: item.product_text.trim(),
          quantity: Number(item.quantity) || 1,
          size: item.size.trim() || null,
          colour: item.colour.trim() || null,
          customization_data: item.customization_data.filter(
            (f) => f.label.trim().length > 0
          ),
        })),

        total_amount: amount ? Number(amount) : null,
        payment_status: paymentStatus,
      });

      setOrder(updated);
      setEditing(false);

      toast.success("Order updated.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to save changes."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleNotifyCustomer() {
    if (!order) return;

    const phoneNumber = extractPhoneNumber(order.customer_details);

    if (!phoneNumber) {
      toast.error(
        "Customer phone number was not found. Please add a valid Indian mobile number to Customer Details."
      );
      return;
    }

    const message = getNotificationMessage(order);

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, "_blank");

    toast.success("WhatsApp message is ready to send.");
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
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
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/dashboard"
        className="mb-4 flex items-center gap-1.5 text-sm text-ink-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight text-brand-dark">
            {order.order_number}
          </p>

          <p className="text-sm text-ink-muted">
            Created {formatDate(order.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/orders/${order.id}/print`}
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-border-strong bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
          >
            <Printer className="h-4 w-4" />
            Print
          </Link>

          <PaymentStatusBadge status={order.payment_status} />
        </div>
      </div>

      {/* Priority */}
      <div className="mb-6 rounded-2xl border border-border bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Priority
        </h2>

        <OrderUrgencySelector
          order={order}
          onUpdated={setOrder}
        />
      </div>

      {/* Product / edit toggle */}
      <div className="mb-6 rounded-2xl border border-border bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Order Details
          </h2>

          {!editing ? (
            <button
              onClick={() => startEditing(order)}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-dark"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          ) : (
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-muted"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          )}
        </div>

        {!editing ? (
          <>
            <p className="mb-4 whitespace-pre-line rounded-xl bg-paper p-3 text-sm text-ink">
              {order.customer_details}
            </p>

            <div className="space-y-4">
              {order.line_items.map((item, i) => (
                <div
                  key={i}
                  className={
                    i > 0
                      ? "border-t border-border pt-4"
                      : ""
                  }
                >
                  <p className="mb-1 text-xs text-ink-muted">
                    {item.category_text}
                  </p>

                  <p className="mb-3 font-display text-lg font-bold text-ink">
                    {item.product_text}
                  </p>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-ink-muted">
                        Size
                      </p>

                      <p className="text-sm font-medium text-ink">
                        {item.size || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-ink-muted">
                        Colour
                      </p>

                      <p className="text-sm font-medium text-ink">
                        {item.colour || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-ink-muted">
                        Quantity
                      </p>

                      <p className="text-sm font-medium text-ink">
                        {item.quantity}
                      </p>
                    </div>
                  </div>

                  {item.customization_data.filter(
                    (f) => f.value?.trim()
                  ).length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {item.customization_data
                        .filter((f) => f.value?.trim())
                        .map((f, fi) => (
                          <p
                            key={fi}
                            className="text-sm text-ink"
                          >
                            <span className="text-ink-muted">
                              {f.label}:
                            </span>{" "}
                            {f.value}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="font-display text-lg font-bold text-ink">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <TextAreaField
              label="Customer Details"
              required
              value={customerDetails}
              onChange={(e) =>
                setCustomerDetails(e.target.value)
              }
              className="min-h-[120px]"
            />

            <LineItemsEditor
              items={editLineItems}
              onChange={setEditLineItems}
              errors={lineItemErrors}
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Total Amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
              />

              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  Payment Status
                </span>

                <select
                  value={paymentStatus}
                  onChange={(e) =>
                    setPaymentStatus(
                      e.target.value as PaymentStatus
                    )
                  }
                  className="w-full rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-base text-ink outline-none focus:border-brand-dark"
                >
                  <option value="NOT_PAID">
                    Not Paid
                  </option>

                  <option value="PAID">
                    Paid
                  </option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Files */}
      <div className="mb-6 rounded-2xl border border-border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Files
        </h2>

        <OrderFiles
          files={order.files ?? []}
          orderNumber={order.order_number}
        />

        <div className="mt-4">
          <FileUploader
            orderId={order.id}
            onUploaded={(file) =>
              setOrder((prev) =>
                prev
                  ? {
                      ...prev,
                      files: [
                        ...(prev.files ?? []),
                        file,
                      ],
                    }
                  : prev
              )
            }
          />
        </div>
      </div>

      {/* Production Status */}
      <div className="mb-6 rounded-2xl border border-border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Production Status
        </h2>

        <StatusSelector
          order={order}
          onUpdated={setOrder}
        />

        {/* WhatsApp notification */}
        <div className="mt-5 border-t border-border pt-5">
          <button
            type="button"
            onClick={handleNotifyCustomer}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
          >
            <MessageCircle className="h-5 w-5" />
            {getNotificationLabel(order)}
          </button>

          <p className="mt-2 text-center text-xs text-ink-faint">
            WhatsApp will open with a ready-made message.
            Nothing is sent until you press Send.
          </p>
        </div>
      </div>

      {/* Dispatch */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Dispatch Details
        </h2>

        <DispatchForm
          orderId={order.id}
          dispatch={order.dispatch}
          onSaved={(dispatch) =>
            setOrder((prev) =>
              prev
                ? {
                    ...prev,
                    dispatch,
                  }
                : prev
            )
          }
        />
      </div>
    </div>
  );
}