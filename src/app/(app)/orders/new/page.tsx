"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import OwnerAccessPrompt from "@/components/OwnerAccessPrompt";
import { Button } from "@/components/ui/Button";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/Field";
import {
  LineItemsEditor,
  emptyLineItem,
  type EditableLineItem,
} from "@/components/orders/LineItemsEditor";
import {
  StagedFilePicker,
  type StagedFile,
} from "@/components/orders/StagedFilePicker";
import {
  createOrderRequest,
  uploadOrderFile,
  fetchOrders,
} from "@/lib/api";
import type {
  PaymentStatus,
  UrgencyLevel,
} from "@/lib/types";

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

function extractCustomerName(customerDetails: string) {
  if (!customerDetails) return "Existing Customer";

  const lines = customerDetails
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const nameLine = lines.find((line) => /name\s*:/i.test(line));

  if (nameLine) {
    return nameLine.replace(/^.*name\s*:\s*/i, "").trim();
  }

  return lines[0]
    ?.replace(/^customer\s*:\s*/i, "")
    .replace(/^name\s*:\s*/i, "")
    .trim() || "Existing Customer";
}

export default function NewOrderPage() {
  const router = useRouter();

  const [ownerUnlocked, setOwnerUnlocked] = useState(false);

  // Customer details
  const [customerDetails, setCustomerDetails] = useState("");

  // Existing customer detection
  const [existingCustomer, setExistingCustomer] = useState<{
    name: string;
    phone: string;
    orderCount: number;
    totalSpent: number;
  } | null>(null);

  const [checkingCustomer, setCheckingCustomer] = useState(false);

  // Files
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [primaryLocalId, setPrimaryLocalId] = useState<string | null>(null);

  // Products
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([
    emptyLineItem(),
  ]);

  // Urgency
  const [urgency, setUrgency] =
    useState<UrgencyLevel>("NORMAL");

  // Payment
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("NOT_PAID");

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  const [lineItemErrors, setLineItemErrors] = useState<
    Record<
      number,
      {
        categoryText?: string;
        productText?: string;
      }
    >
  >({});

  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const [createdOrderId, setCreatedOrderId] =
    useState<string | null>(null);

  const [createdOrderNumber, setCreatedOrderNumber] =
    useState<string | null>(null);

  const [fileUploadStatus, setFileUploadStatus] =
    useState<
      "idle" | "uploading" | "done" | "partial-failure"
    >("idle");

  // Check whether the entered phone belongs to an existing customer
  useEffect(() => {
    const phone = extractPhoneNumber(customerDetails);

    if (phone.length !== 10) {
      setExistingCustomer(null);
      setCheckingCustomer(false);
      return;
    }

    let cancelled = false;

    setCheckingCustomer(true);

    fetchOrders({
      status: "ALL",
      urgency: "ALL",
      page_size: 100,
    })
      .then(({ orders }) => {
        if (cancelled) return;

        const matchingOrders = orders.filter((order) => {
          const orderPhone = extractPhoneNumber(
            order.customer_details || ""
          );

          return orderPhone === phone;
        });

        if (matchingOrders.length === 0) {
          setExistingCustomer(null);
          return;
        }

        const firstOrder = matchingOrders[0];

        const name = extractCustomerName(
          firstOrder.customer_details || ""
        );

        const totalSpent = matchingOrders.reduce(
          (total, order) =>
            total + Number(order.total_amount || 0),
          0
        );

        setExistingCustomer({
          name,
          phone,
          orderCount: matchingOrders.length,
          totalSpent,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setExistingCustomer(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingCustomer(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [customerDetails]);

  function resetForm() {
    setCustomerDetails("");

    stagedFiles.forEach(
      (f) =>
        f.previewUrl &&
        URL.revokeObjectURL(f.previewUrl)
    );

    setStagedFiles([]);
    setPrimaryLocalId(null);
    setLineItems([emptyLineItem()]);
    setUrgency("NORMAL");
    setAmount("");
    setPaymentStatus("NOT_PAID");
    setErrors({});
    setLineItemErrors({});
    setSubmitError(null);
    setCreatedOrderId(null);
    setCreatedOrderNumber(null);
    setFileUploadStatus("idle");
    setExistingCustomer(null);
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setErrors({});
    setLineItemErrors({});
    setSubmitError(null);

    const nextErrors: Record<string, string> = {};

    if (!customerDetails.trim()) {
      nextErrors.customerDetails =
        "Customer details are required.";
    }

    const nextLineItemErrors: Record<
      number,
      {
        categoryText?: string;
        productText?: string;
      }
    > = {};

    lineItems.forEach((item, index) => {
      const itemErrors: {
        categoryText?: string;
        productText?: string;
      } = {};

      if (!item.category_text.trim()) {
        itemErrors.categoryText =
          "Category is required.";
      }

      if (!item.product_text.trim()) {
        itemErrors.productText =
          "Product is required.";
      }

      if (Object.keys(itemErrors).length > 0) {
        nextLineItemErrors[index] = itemErrors;
      }
    });

    if (
      Object.keys(nextErrors).length > 0 ||
      Object.keys(nextLineItemErrors).length > 0
    ) {
      setErrors(nextErrors);
      setLineItemErrors(nextLineItemErrors);
      return;
    }

    setSubmitting(true);

    try {
      const cleanedLineItems = lineItems.map(
        (item) => ({
          category_text: item.category_text.trim(),
          product_text: item.product_text.trim(),
          quantity: Number(item.quantity) || 1,
          size: item.size.trim() || null,
          colour: item.colour.trim() || null,
          customization_data:
            item.customization_data.filter(
              (f) => f.label.trim().length > 0
            ),
        })
      );

      const { order } = await createOrderRequest({
        customer_details:
          customerDetails.trim(),
        line_items: cleanedLineItems,
        total_amount: amount
          ? Number(amount)
          : null,
        payment_status: paymentStatus,
        urgency,
      });

      setCreatedOrderId(order.id);
      setCreatedOrderNumber(order.order_number);
      setSubmitting(false);

      const readyFiles = stagedFiles.filter(
        (f) => f.status === "ready"
      );

      if (readyFiles.length > 0) {
        setFileUploadStatus("uploading");

        let failureCount = 0;

        for (const f of readyFiles) {
          try {
            await uploadOrderFile(
              order.id,
              f.file,
              f.localId === primaryLocalId
            );
          } catch {
            failureCount += 1;
          }
        }

        setFileUploadStatus(
          failureCount > 0
            ? "partial-failure"
            : "done"
        );

        if (failureCount > 0) {
          toast.error(
            `${failureCount} file${
              failureCount === 1 ? "" : "s"
            } couldn't be uploaded. You can add them from the order page.`
          );
        }
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Unable to save order. Your entered information has not been cleared."
      );

      setSubmitting(false);
    }
  }

  if (createdOrderId && createdOrderNumber) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
        <div className="rounded-2xl border border-status-ready/30 bg-status-ready/5 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-status-ready" />

          <h1 className="font-display text-xl font-bold text-ink">
            Order created successfully.
          </h1>

          <p className="mt-1 text-sm text-ink-muted">
            Order ID
          </p>

          <p className="font-display text-2xl font-bold tracking-tight text-brand-dark">
            {createdOrderNumber}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-ink">
            Files
          </h2>

          {fileUploadStatus === "uploading" && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading files...
            </p>
          )}

          {fileUploadStatus === "done" && (
            <p className="text-sm text-status-ready-text">
              All files uploaded.
            </p>
          )}

          {fileUploadStatus === "partial-failure" && (
            <p className="text-sm text-status-pending-text">
              Some files failed to upload. You can add
              them from the order page below.
            </p>
          )}

          {fileUploadStatus === "idle" && (
            <p className="text-sm text-ink-muted">
              No files were attached. You can add files
              any time from the order page.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1"
            size="lg"
            onClick={() =>
              router.push(`/orders/${createdOrderId}`)
            }
          >
            View Order
          </Button>

          <Button
            variant="secondary"
            className="flex-1"
            size="lg"
            onClick={resetForm}
          >
            Create Another Order
          </Button>
        </div>
      </div>
    );
  }

  if (!ownerUnlocked) {
    return (
      <OwnerAccessPrompt
        onSuccess={() => setOwnerUnlocked(true)}
        onCancel={() => router.push("/")}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        New Order
      </h1>

      <p className="mb-6 text-sm text-ink-muted">
        Enter the order details from your WhatsApp chat.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        {/* Priority */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Priority
          </h2>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUrgency("NORMAL")}
              className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                urgency === "NORMAL"
                  ? "border-brand-dark bg-brand text-ink"
                  : "border-border-strong bg-white text-ink-muted hover:bg-paper"
              }`}
            >
              Normal
            </button>

            <button
              type="button"
              onClick={() => setUrgency("URGENT")}
              className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                urgency === "URGENT"
                  ? "border-status-pending bg-status-pending text-white"
                  : "border-border-strong bg-white text-ink-muted hover:bg-paper"
              }`}
            >
              Urgent
            </button>
          </div>
        </section>

        {/* Customer Details */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Customer Details
          </h2>

          <TextAreaField
            label="Name, WhatsApp Number, Phone Number, Delivery Address, Pincode"
            required
            value={customerDetails}
            onChange={(e) =>
              setCustomerDetails(e.target.value)
            }
            error={errors.customerDetails}
            placeholder={
              "Priya Ramesh\n98765 43210\n123 ABC Street, Coimbatore\n641001"
            }
            className="min-h-[140px]"
          />

          {/* Existing Customer */}
          {checkingCustomer && (
            <p className="mt-3 text-sm text-ink-muted">
              Checking customer history...
            </p>
          )}

          {existingCustomer && !checkingCustomer && (
            <div className="mt-4 rounded-xl border border-brand/40 bg-brand/10 p-4">
              <p className="font-semibold text-ink">
                Existing Customer
              </p>

              <p className="mt-1 text-sm text-ink">
                {existingCustomer.name}
              </p>

              <p className="text-sm text-ink-muted">
                📞 {existingCustomer.phone}
              </p>

              <div className="mt-3 flex gap-6 text-sm">
                <div>
                  <span className="text-ink-muted">
                    Previous Orders
                  </span>

                  <p className="font-bold text-ink">
                    {existingCustomer.orderCount}
                  </p>
                </div>

                <div>
                  <span className="text-ink-muted">
                    Total Spent
                  </span>

                  <p className="font-bold text-ink">
                    ₹
                    {existingCustomer.totalSpent.toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>
              </div>

              <a
                href={`/customers/${existingCustomer.phone}`}
                className="mt-3 inline-block text-sm font-semibold text-ink underline"
              >
                View Customer History →
              </a>
            </div>
          )}
        </section>

        {/* Files */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Files
          </h2>

          <p className="mb-4 text-sm text-ink-muted">
            Add every photo or document the customer sent
            — any file type, several at once.
          </p>

          <StagedFilePicker
            files={stagedFiles}
            onFilesChange={setStagedFiles}
            primaryLocalId={primaryLocalId}
            onPrimaryChange={setPrimaryLocalId}
          />
        </section>

        {/* Products */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Products
          </h2>

          <p className="mb-4 text-sm text-ink-muted">
            Add every product in this order — tap
            &quot;Add another product&quot; for more than one.
          </p>

          <LineItemsEditor
            items={lineItems}
            onChange={setLineItems}
            errors={lineItemErrors}
          />
        </section>

        {/* Payment */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Payment
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Total Amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              placeholder="₹"
            />

            <SelectField
              label="Payment Status"
              value={paymentStatus}
              onChange={(e) =>
                setPaymentStatus(
                  e.target.value as PaymentStatus
                )
              }
            >
              <option value="NOT_PAID">
                Not Paid
              </option>

              <option value="PAID">
                Paid
              </option>
            </SelectField>
          </div>
        </section>

        {/* Error */}
        {submitError && (
          <div className="rounded-xl border border-status-pending/30 bg-status-pending/5 p-3 text-sm text-status-pending-text">
            {submitError}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Create Order"
          )}
        </Button>
      </form>
    </div>
  );
}