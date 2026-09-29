"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import OwnerAccessPrompt from "@/components/OwnerAccessPrompt";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { LineItemsEditor, emptyLineItem, type EditableLineItem } from "@/components/orders/LineItemsEditor";
import { StagedFilePicker, type StagedFile } from "@/components/orders/StagedFilePicker";
import { createOrderRequest, uploadOrderFile } from "@/lib/api";
import type { PaymentStatus, UrgencyLevel } from "@/lib/types";

export default function NewOrderPage() {
  const router = useRouter();
  const [ownerUnlocked, setOwnerUnlocked] = useState(false);

  // Single combined customer details block
  const [customerDetails, setCustomerDetails] = useState("");

  // Files — staged locally until the order is created
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [primaryLocalId, setPrimaryLocalId] = useState<string | null>(null);

  // Products in this order — one order can hold several
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([emptyLineItem()]);

  // Urgency
  const [urgency, setUrgency] = useState<UrgencyLevel>("NORMAL");

  // Payment
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("NOT_PAID");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lineItemErrors, setLineItemErrors] = useState<
    Record<number, { categoryText?: string; productText?: string }>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [fileUploadStatus, setFileUploadStatus] = useState<
    "idle" | "uploading" | "done" | "partial-failure"
  >("idle");

  function resetForm() {
    setCustomerDetails("");
    stagedFiles.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLineItemErrors({});
    setSubmitError(null);

    const nextErrors: Record<string, string> = {};
    if (!customerDetails.trim()) nextErrors.customerDetails = "Customer details are required.";

    const nextLineItemErrors: Record<number, { categoryText?: string; productText?: string }> = {};
    lineItems.forEach((item, index) => {
      const itemErrors: { categoryText?: string; productText?: string } = {};
      if (!item.category_text.trim()) itemErrors.categoryText = "Category is required.";
      if (!item.product_text.trim()) itemErrors.productText = "Product is required.";
      if (Object.keys(itemErrors).length > 0) nextLineItemErrors[index] = itemErrors;
    });

    if (Object.keys(nextErrors).length > 0 || Object.keys(nextLineItemErrors).length > 0) {
      setErrors(nextErrors);
      setLineItemErrors(nextLineItemErrors);
      return;
    }

    setSubmitting(true);
    try {
      const cleanedLineItems = lineItems.map((item) => ({
        category_text: item.category_text.trim(),
        product_text: item.product_text.trim(),
        quantity: Number(item.quantity) || 1,
        size: item.size.trim() || null,
        colour: item.colour.trim() || null,
        customization_data: item.customization_data.filter((f) => f.label.trim().length > 0),
      }));

      const { order } = await createOrderRequest({
        customer_details: customerDetails.trim(),
        line_items: cleanedLineItems,
        total_amount: amount ? Number(amount) : null,
        payment_status: paymentStatus,
        urgency,
      });

      setCreatedOrderId(order.id);
      setCreatedOrderNumber(order.order_number);
      setSubmitting(false);

      const readyFiles = stagedFiles.filter((f) => f.status === "ready");
      if (readyFiles.length > 0) {
        setFileUploadStatus("uploading");
        let failureCount = 0;
        for (const f of readyFiles) {
          try {
            await uploadOrderFile(order.id, f.file, f.localId === primaryLocalId);
          } catch {
            failureCount += 1;
          }
        }
        setFileUploadStatus(failureCount > 0 ? "partial-failure" : "done");
        if (failureCount > 0) {
          toast.error(
            `${failureCount} file${failureCount === 1 ? "" : "s"} couldn't be uploaded. You can add them from the order page.`
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
          <h1 className="font-display text-xl font-bold text-ink">Order created successfully.</h1>
          <p className="mt-1 text-sm text-ink-muted">Order ID</p>
          <p className="font-display text-2xl font-bold tracking-tight text-brand-dark">
            {createdOrderNumber}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-ink">Files</h2>
          {fileUploadStatus === "uploading" && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading files...
            </p>
          )}
          {fileUploadStatus === "done" && (
            <p className="text-sm text-status-ready-text">All files uploaded.</p>
          )}
          {fileUploadStatus === "partial-failure" && (
            <p className="text-sm text-status-pending-text">
              Some files failed to upload. You can add them from the order page below.
            </p>
          )}
          {fileUploadStatus === "idle" && (
            <p className="text-sm text-ink-muted">
              No files were attached. You can add files any time from the order page.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" size="lg" onClick={() => router.push(`/orders/${createdOrderId}`)}>
            View Order
          </Button>
          <Button variant="secondary" className="flex-1" size="lg" onClick={resetForm}>
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

    <form onSubmit={handleSubmit} className="space-y-8">
        {/* Urgency — set right at the top since it drives production priority */}
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

        {/* Single combined customer details block */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Customer Details
          </h2>
          <TextAreaField
            label="Name, WhatsApp Number, Phone Number, Delivery Address, Pincode"
            required
            value={customerDetails}
            onChange={(e) => setCustomerDetails(e.target.value)}
            error={errors.customerDetails}
            placeholder={"Priya Ramesh\n98765 43210\n123 ABC Street, Coimbatore\n641001"}
            className="min-h-[140px]"
          />
        </section>

        {/* Files — any type accepted */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Files
          </h2>
          <p className="mb-4 text-sm text-ink-muted">
            Add every photo or document the customer sent — any file type, several at once.
          </p>
          <StagedFilePicker
            files={stagedFiles}
            onFilesChange={setStagedFiles}
            primaryLocalId={primaryLocalId}
            onPrimaryChange={setPrimaryLocalId}
          />
        </section>

        {/* Products — one order can hold several for the same customer */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Products
          </h2>
          <p className="mb-4 text-sm text-ink-muted">
            Add every product in this order — tap &quot;Add another product&quot; for more than one.
          </p>
          <LineItemsEditor items={lineItems} onChange={setLineItems} errors={lineItemErrors} />
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
              onChange={(e) => setAmount(e.target.value)}
              placeholder="₹"
            />
            <SelectField
              label="Payment Status"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            >
              <option value="NOT_PAID">Not Paid</option>
              <option value="PAID">Paid</option>
            </SelectField>
          </div>
        </section>

        {submitError && (
          <div className="rounded-xl border border-status-pending/30 bg-status-pending/5 p-3 text-sm text-status-pending-text">
            {submitError}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Order"}
        </Button>
      </form>
    </div>
  );
}
