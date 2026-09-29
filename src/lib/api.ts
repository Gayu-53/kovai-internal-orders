import type {
  DashboardStats,
  DispatchDetails,
  Order,
  OrderFile,
  OrderListFilters,
  SalesSummary,
} from "./types";
import type { OrderInput } from "./validation";

async function parseOrThrow<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data as T;
}

export async function fetchOrders(
  filters: OrderListFilters
): Promise<{ orders: Order[]; totalCount: number }> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.urgency) params.set("urgency", filters.urgency);
  if (filters.category_text) params.set("category_text", filters.category_text);
  if (filters.size) params.set("size", filters.size);
  if (filters.search) params.set("search", filters.search);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.page_size) params.set("page_size", String(filters.page_size));

  const res = await fetch(`/api/orders?${params.toString()}`);
  return parseOrThrow(res);
}

export async function fetchOrder(id: string): Promise<{ order: Order }> {
  const res = await fetch(`/api/orders/${id}`);
  return parseOrThrow(res);
}

export async function createOrderRequest(input: OrderInput): Promise<{ order: Order }> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(res);
}

export async function updateOrderRequest(
  id: string,
  input: Partial<OrderInput>
): Promise<{ order: Order }> {
  const res = await fetch(`/api/orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(res);
}

export async function updateOrderStatusRequest(
  id: string,
  production_status: string
): Promise<{ order: Order }> {
  const res = await fetch(`/api/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ production_status }),
  });
  return parseOrThrow(res);
}

export async function updateOrderUrgencyRequest(
  id: string,
  urgency: "NORMAL" | "URGENT"
): Promise<{ order: Order }> {
  const res = await fetch(`/api/orders/${id}/urgency`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urgency }),
  });
  return parseOrThrow(res);
}

export async function uploadOrderFile(
  orderId: string,
  file: File,
  isPrimary = false
): Promise<{ file: OrderFile }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("is_primary", String(isPrimary));
  const res = await fetch(`/api/orders/${orderId}/files`, {
    method: "POST",
    body: formData,
  });
  return parseOrThrow(res);
}

export async function deleteOrderFileRequest(orderId: string, fileId: string): Promise<void> {
  const res = await fetch(`/api/orders/${orderId}/files/${fileId}`, { method: "DELETE" });
  await parseOrThrow(res);
}

export async function setPrimaryFileRequest(orderId: string, fileId: string): Promise<void> {
  const res = await fetch(`/api/orders/${orderId}/files/${fileId}/primary`, { method: "PATCH" });
  await parseOrThrow(res);
}

export async function saveDispatchDetails(
  orderId: string,
  details: {
    dispatch_date?: string | null;
    courier_name?: string | null;
    tracking_number?: string | null;
    notes?: string | null;
  }
): Promise<{ dispatch: DispatchDetails }> {
  const res = await fetch(`/api/orders/${orderId}/dispatch`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
  });
  return parseOrThrow(res);
}

export async function fetchDashboardStats(): Promise<{ stats: DashboardStats }> {
  const res = await fetch("/api/dashboard/stats");
  return parseOrThrow(res);
}

export async function fetchSizes(): Promise<{ sizes: string[] }> {
  const res = await fetch("/api/sizes");
  return parseOrThrow(res);
}

export async function fetchOrderCategories(): Promise<{ categories: string[] }> {
  const res = await fetch("/api/order-categories");
  return parseOrThrow(res);
}

export async function fetchSalesSummary(filters: {
  date_from?: string;
  date_to?: string;
}): Promise<{ summary: SalesSummary }> {
  const params = new URLSearchParams();
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  const qs = params.toString();
  const res = await fetch(`/api/sales-summary${qs ? `?${qs}` : ""}`);
  return parseOrThrow(res);
}
