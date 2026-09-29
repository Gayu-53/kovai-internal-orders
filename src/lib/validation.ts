import { z } from "zod";

const lineItemSchema = z.object({
  category_text: z.string().trim().min(1, "Category is required."),
  product_text: z.string().trim().min(1, "Product is required."),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  size: z.string().trim().optional().or(z.literal("")).nullable(),
  colour: z.string().trim().optional().or(z.literal("")).nullable(),
  customization_data: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Please give this field a heading."),
        value: z.string(),
      })
    )
    .default([]),
});

export const orderInputSchema = z.object({
  customer_details: z.string().trim().min(1, "Customer details are required."),

  // One order can hold several products for the same customer.
  line_items: z.array(lineItemSchema).min(1, "Add at least one product."),

  total_amount: z.coerce.number().min(0).optional().nullable(),
  payment_status: z.enum(["PAID", "NOT_PAID"]).default("NOT_PAID"),
  urgency: z.enum(["NORMAL", "URGENT"]).default("NORMAL"),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
export type LineItemInput = z.infer<typeof lineItemSchema>;

export const statusUpdateSchema = z.object({
  production_status: z.enum(["PENDING", "PRODUCTION", "READY", "DISPATCHED", "CANCELLED"]),
});

export const urgencyUpdateSchema = z.object({
  urgency: z.enum(["NORMAL", "URGENT"]),
});

export const dispatchDetailsSchema = z.object({
  dispatch_date: z.string().datetime().optional().nullable(),
  courier_name: z.string().trim().optional().nullable(),
  tracking_number: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

// No file-type restriction: photos, PDFs, Word docs, or any other format the
// customer sends can be attached and are stored/shown as documents.
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB ceiling

export function validateOrderFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File is too large. Please upload a file under 20MB.";
  }
  return null;
}
