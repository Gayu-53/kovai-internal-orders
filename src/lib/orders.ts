import "server-only";
import { getSupabaseAdmin, ORDER_FILES_BUCKET } from "./supabaseAdmin";
import { buildLineItemFromLegacyOrder, normalizeCustomFields, normalizeLineItems } from "./types";
import type {
  DashboardStats,
  DispatchDetails,
  Order,
  OrderFile,
  OrderListFilters,
  ProductionStatus,
  SalesSummary,
  UrgencyLevel,
} from "./types";
import type { OrderInput } from "./validation";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

function normalizeOrder(raw: unknown): Order {
  const order = raw as Order;
  const customizationData = normalizeCustomFields(order.customization_data);
  const lineItems = normalizeLineItems(order.line_items);

  return {
    ...order,
    customization_data: customizationData,
    // Orders created before multi-product support have an empty
    // line_items array but real data in the legacy columns — build a
    // one-item array from those so every caller can just read line_items.
    line_items:
      lineItems.length > 0
        ? lineItems
        : buildLineItemFromLegacyOrder({
            category_text: order.category_text,
            product_text: order.product_text,
            quantity: order.quantity,
            size: order.size,
            colour: order.colour,
            customization_data: customizationData,
          }),
  };
}

async function attachFileUrls(files: OrderFile[]): Promise<OrderFile[]> {
  if (files.length === 0) return files;
  const supabase = getSupabaseAdmin();
  const paths = files.map((f) => f.storage_path);
  const { data, error } = await supabase.storage
    .from(ORDER_FILES_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return files;

  return files.map((f, i) => ({ ...f, url: data[i]?.signedUrl ?? null }));
}

export async function generateOrderNumber(): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("next_order_number");
  if (error) throw new Error(`Failed to generate order number: ${error.message}`);
  return data as string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("production_status, urgency", { count: "exact" });

  if (error) throw new Error(`Failed to load dashboard stats: ${error.message}`);

  const rows = data ?? [];
  const count = (status: ProductionStatus) =>
    rows.filter((r) => r.production_status === status).length;

  return {
    total: rows.length,
    pending: count("PENDING"),
    production: count("PRODUCTION"),
    ready: count("READY"),
    dispatched: count("DISPATCHED"),
    urgent: rows.filter((r) => r.urgency === "URGENT").length,
  };
}

export async function listOrders(
  filters: OrderListFilters
): Promise<{ orders: Order[]; totalCount: number }> {
  const supabase = getSupabaseAdmin();
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("orders")
    .select("*, files:order_files(*), dispatch:dispatch_details(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status && filters.status !== "ALL") {
    query = query.eq("production_status", filters.status);
  }
  if (filters.urgency && filters.urgency !== "ALL") {
    query = query.eq("urgency", filters.urgency);
  }
  if (filters.category_text) {
    query = query.ilike("category_text", `%${filters.category_text}%`);
  }
  if (filters.size) {
    query = query.eq("size", filters.size);
  }
  if (filters.date_from) {
    query = query.gte("order_date", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("order_date", filters.date_to);
  }
  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(
      `order_number.ilike.%${term}%,customer_details.ilike.%${term}%,category_text.ilike.%${term}%,product_text.ilike.%${term}%`
    );
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to load orders: ${error.message}`);

  const orders = ((data ?? []) as unknown[]).map(normalizeOrder);
  for (const order of orders) {
    if (order.files) {
      order.files.sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
      order.files = await attachFileUrls(order.files);
    }
  }

  return { orders, totalCount: count ?? 0 };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*, files:order_files(*), dispatch:dispatch_details(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load order: ${error.message}`);
  if (!data) return null;

  const order = normalizeOrder(data);
  if (order.files) {
    order.files.sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
    order.files = await attachFileUrls(order.files);
  }
  return order;
}

export async function createOrder(input: OrderInput): Promise<Order> {
  const supabase = getSupabaseAdmin();
  const orderNumber = await generateOrderNumber();
  const firstItem = input.line_items[0];

  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_details: input.customer_details,
      line_items: input.line_items,
      // Mirror the first line item into the legacy columns so existing
      // search/filter-by-category/size queries keep working without
      // needing to search inside the JSONB array.
      category_text: firstItem?.category_text ?? null,
      product_text: firstItem?.product_text ?? null,
      quantity: firstItem?.quantity ?? 1,
      size: firstItem?.size ?? null,
      colour: firstItem?.colour ?? null,
      customization_data: firstItem?.customization_data ?? [],
      total_amount: input.total_amount ?? null,
      payment_status: input.payment_status,
      production_status: "PENDING",
      urgency: input.urgency ?? "NORMAL",
    })
    .select("*, files:order_files(*), dispatch:dispatch_details(*)")
    .single();

  if (error) throw new Error(`Failed to create order: ${error.message}`);
  return normalizeOrder(data);
}

export async function updateOrder(id: string, input: Partial<OrderInput>): Promise<Order> {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = {};

  if (input.customer_details !== undefined) patch.customer_details = input.customer_details;
  if (input.line_items !== undefined) {
    patch.line_items = input.line_items;
    const firstItem = input.line_items[0];
    patch.category_text = firstItem?.category_text ?? null;
    patch.product_text = firstItem?.product_text ?? null;
    patch.quantity = firstItem?.quantity ?? 1;
    patch.size = firstItem?.size ?? null;
    patch.colour = firstItem?.colour ?? null;
    patch.customization_data = firstItem?.customization_data ?? [];
  }
  if (input.total_amount !== undefined) patch.total_amount = input.total_amount ?? null;
  if (input.payment_status !== undefined) patch.payment_status = input.payment_status;
  if (input.urgency !== undefined) patch.urgency = input.urgency;

  const { data, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", id)
    .select("*, files:order_files(*), dispatch:dispatch_details(*)")
    .single();

  if (error) throw new Error(`Failed to update order: ${error.message}`);
  return normalizeOrder(data);
}

export async function updateOrderStatus(id: string, status: ProductionStatus): Promise<Order> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .update({ production_status: status })
    .eq("id", id)
    .select("*, files:order_files(*), dispatch:dispatch_details(*)")
    .single();

  if (error) throw new Error(`Failed to update order status: ${error.message}`);
  return normalizeOrder(data);
}

export async function updateOrderUrgency(id: string, urgency: UrgencyLevel): Promise<Order> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .update({ urgency })
    .eq("id", id)
    .select("*, files:order_files(*), dispatch:dispatch_details(*)")
    .single();

  if (error) throw new Error(`Failed to update urgency: ${error.message}`);
  return normalizeOrder(data);
}

export async function upsertDispatchDetails(
  orderId: string,
  details: Partial<DispatchDetails>
): Promise<DispatchDetails> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("dispatch_details")
    .upsert(
      {
        order_id: orderId,
        dispatch_date: details.dispatch_date ?? null,
        courier_name: details.courier_name ?? null,
        tracking_number: details.tracking_number ?? null,
        notes: details.notes ?? null,
      },
      { onConflict: "order_id" }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to save dispatch details: ${error.message}`);
  return data as DispatchDetails;
}

export async function addOrderFile(
  orderId: string,
  storagePath: string,
  originalFilename: string,
  contentType: string,
  fileSizeBytes: number,
  isPrimary: boolean,
  sortOrder: number
): Promise<OrderFile> {
  const supabase = getSupabaseAdmin();

  if (isPrimary) {
    await supabase
      .from("order_files")
      .update({ is_primary: false })
      .eq("order_id", orderId)
      .eq("is_primary", true);
  }

  const { data, error } = await supabase
    .from("order_files")
    .insert({
      order_id: orderId,
      storage_path: storagePath,
      original_filename: originalFilename,
      content_type: contentType,
      file_size_bytes: fileSizeBytes,
      is_primary: isPrimary,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save file record: ${error.message}`);
  return data as OrderFile;
}
export async function deleteOrder(orderId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // 1. Get all files belonging to this order
  const { data: files, error: filesFetchError } = await supabase
    .from("order_files")
    .select("id, storage_path")
    .eq("order_id", orderId);

  if (filesFetchError) {
    throw new Error(
      `Failed to load order files: ${filesFetchError.message}`
    );
  }

  // 2. Delete the actual files from Supabase Storage
  if (files && files.length > 0) {
    const storagePaths = files
      .map((file) => file.storage_path)
      .filter(Boolean);

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(ORDER_FILES_BUCKET)
        .remove(storagePaths);

      if (storageError) {
        throw new Error(
          `Failed to delete order files from storage: ${storageError.message}`
        );
      }
    }

    // 3. Delete the order_files database records
    const { error: filesDeleteError } = await supabase
      .from("order_files")
      .delete()
      .eq("order_id", orderId);

    if (filesDeleteError) {
      throw new Error(
        `Failed to delete order file records: ${filesDeleteError.message}`
      );
    }
  }

  // 4. Delete dispatch details for this order
  const { error: dispatchDeleteError } = await supabase
    .from("dispatch_details")
    .delete()
    .eq("order_id", orderId);

  if (dispatchDeleteError) {
    throw new Error(
      `Failed to delete dispatch details: ${dispatchDeleteError.message}`
    );
  }

  // 5. Finally delete the order itself
  const { data: deletedOrder, error: orderDeleteError } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .select("id")
    .maybeSingle();

  if (orderDeleteError) {
    throw new Error(
      `Failed to delete order: ${orderDeleteError.message}`
    );
  }

  if (!deletedOrder) {
    throw new Error("Order not found.");
  }
}

export async function deleteOrderFile(fileId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: file, error: fetchError } = await supabase
    .from("order_files")
    .select("*")
    .eq("id", fileId)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to find file: ${fetchError.message}`);
  if (!file) return;

  await supabase.storage.from(ORDER_FILES_BUCKET).remove([file.storage_path]);

  const { error: deleteError } = await supabase.from("order_files").delete().eq("id", fileId);
  if (deleteError) throw new Error(`Failed to delete file record: ${deleteError.message}`);
}

export async function setPrimaryFile(orderId: string, fileId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("order_files")
    .update({ is_primary: false })
    .eq("order_id", orderId)
    .eq("is_primary", true);

  const { error } = await supabase.from("order_files").update({ is_primary: true }).eq("id", fileId);
  if (error) throw new Error(`Failed to set primary file: ${error.message}`);
}

export async function uploadOrderFileBlob(
  orderId: string,
  file: Buffer,
  contentType: string,
  originalFilename: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const extension = originalFilename.includes(".")
    ? originalFilename.split(".").pop()
    : "bin";
  const path = `${orderId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(ORDER_FILES_BUCKET)
    .upload(path, file, { contentType, upsert: false });

  if (error) throw new Error(`Failed to upload file: ${error.message}`);
  return path;
}

export async function getDistinctSizes(): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("orders").select("size").not("size", "is", null);
  if (error) throw new Error(`Failed to load sizes: ${error.message}`);
  const sizes = new Set((data ?? []).map((r) => r.size as string).filter(Boolean));
  return Array.from(sizes).sort();
}

export async function getDistinctCategoryTexts(): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("category_text")
    .not("category_text", "is", null);
  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  const values = new Set((data ?? []).map((r) => r.category_text as string).filter(Boolean));
  return Array.from(values).sort();
}

export async function getSalesSummary(filters: {
  date_from?: string;
  date_to?: string;
}): Promise<SalesSummary> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("orders")
    .select("order_date, total_amount")
    .order("order_date", { ascending: false });

  if (filters.date_from) query = query.gte("order_date", filters.date_from);
  if (filters.date_to) query = query.lte("order_date", filters.date_to);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load sales summary: ${error.message}`);

  const rows = data ?? [];
  const byDate = new Map<string, { order_count: number; total_sales: number }>();

  for (const row of rows) {
    const date = new Date(row.order_date as string).toISOString().slice(0, 10);
    const existing = byDate.get(date) ?? { order_count: 0, total_sales: 0 };
    existing.order_count += 1;
    existing.total_sales += Number(row.total_amount ?? 0);
    byDate.set(date, existing);
  }

  const summaryRows = Array.from(byDate.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    rows: summaryRows,
    totalOrders: rows.length,
    totalSales: rows.reduce((sum, r) => sum + Number(r.total_amount ?? 0), 0),
  };
}
