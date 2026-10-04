export type PaymentStatus = "PAID" | "NOT_PAID";

export type ProductionStatus =
  | "PENDING"
  | "PRODUCTION"
  | "READY"
  | "DISPATCHED"
  | "CANCELLED";

export const PRODUCTION_STATUSES: ProductionStatus[] = [
  "PENDING",
  "PRODUCTION",
  "READY",
  "DISPATCHED",
  "CANCELLED",
];

export type UrgencyLevel = "NORMAL" | "URGENT";

export interface CustomField {
  label: string;
  value: string;
}

/**
 * Normalizes whatever Supabase returns for `customization_data` into a
 * safe CustomField[], defending against any legacy or malformed shape.
 */
export function normalizeCustomFields(raw: unknown): CustomField[] {
  if (Array.isArray(raw)) {
    return raw
      .filter(
        (item): item is Record<string, unknown> => typeof item === "object" && item !== null
      )
      .map((item) => ({
        label: typeof item.label === "string" ? item.label : "",
        value: typeof item.value === "string" ? item.value : String(item.value ?? ""),
      }))
      .filter((f) => f.label.length > 0);
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([, value]) => value !== null && value !== undefined && value !== "")
      .map(([label, value]) => ({ label, value: String(value) }));
  }
  return [];
}

/**
 * One product within an order. An order can have several of these — e.g.
 * a keychain AND a photo frame for the same customer in a single order.
 */
export interface LineItem {
  category_text: string;
  product_text: string;
  quantity: number;
  size: string | null;
  colour: string | null;
  customization_data: CustomField[];
}

/**
 * Normalizes whatever Supabase returns for `line_items` into a safe
 * LineItem[]. Defends against legacy orders that predate line_items (where
 * the array is empty and the product details instead live on the old
 * category_text/product_text/etc. columns directly on the order) — callers
 * should fall back to buildLineItemFromLegacyOrder in that case.
 */
export function normalizeLineItems(raw: unknown): LineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      category_text: typeof item.category_text === "string" ? item.category_text : "",
      product_text: typeof item.product_text === "string" ? item.product_text : "",
      quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
      size: typeof item.size === "string" ? item.size : null,
      colour: typeof item.colour === "string" ? item.colour : null,
      customization_data: normalizeCustomFields(item.customization_data),
    }))
    .filter((item) => item.category_text || item.product_text);
}

/** Builds a single line item from a pre-line_items order's legacy columns. */
export function buildLineItemFromLegacyOrder(order: {
  category_text: string | null;
  product_text: string | null;
  quantity: number;
  size: string | null;
  colour: string | null;
  customization_data: CustomField[];
}): LineItem[] {
  if (!order.category_text && !order.product_text) return [];
  return [
    {
      category_text: order.category_text ?? "",
      product_text: order.product_text ?? "",
      quantity: order.quantity || 1,
      size: order.size,
      colour: order.colour,
      customization_data: order.customization_data,
    },
  ];
}

/**
 * A file attached to an order — any type, not just images. Photos render
 * as an inline preview; everything else (PDFs, docs) shows as a
 * downloadable file card with its name and type.
 */
export interface OrderFile {
  id: string;
  order_id: string;
  storage_path: string;
  original_filename: string | null;
  content_type: string | null;
  file_size_bytes: number | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  /** Populated server-side as a short-lived signed URL, never stored. */
  url: string | null;
}

export interface DispatchDetails {
  id: string;
  order_id: string;
  dispatch_date: string | null;
  courier_name: string | null;
  tracking_number: string | null;
  notes: string | null;
}

export interface Order {
  id: string;
  order_number: string;

  /** One combined block: name, WhatsApp number, phone, address, pincode. */
  customer_details: string;

  /** One or more products in this order. Always prefer this over the
   * legacy category_text/product_text/etc. columns below, which only
   * exist for orders created before multi-product support was added. */
  line_items: LineItem[];

  category_text: string | null;
  product_text: string | null;
  quantity: number;

  size: string | null;
  colour: string | null;
  customization_data: CustomField[];

  total_amount: number | null;
  payment_status: PaymentStatus;
  production_status: ProductionStatus;
  urgency: UrgencyLevel;

  order_date: string;
  created_at: string;
  updated_at: string;

  files?: OrderFile[];
  dispatch?: DispatchDetails | null;
}

export interface DashboardStats {
  total: number;
  pending: number;
  production: number;
  ready: number;
  dispatched: number;
  urgent: number;
}

export interface SalesSummaryRow {
  date: string;
  order_count: number;
  total_sales: number;
}

export interface SalesSummary {
  rows: SalesSummaryRow[];
  totalOrders: number;
  totalSales: number;
}

export interface OrderListFilters {
  status?: ProductionStatus | "ALL";
  urgency?: UrgencyLevel | "ALL";
  category_text?: string;
  size?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}
