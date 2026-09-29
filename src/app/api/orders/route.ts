import { NextRequest, NextResponse } from "next/server";
import { createOrder, listOrders } from "@/lib/orders";
import { orderInputSchema } from "@/lib/validation";
import type { ProductionStatus, UrgencyLevel } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as ProductionStatus | "ALL" | null;
  const urgency = searchParams.get("urgency") as UrgencyLevel | "ALL" | null;

  try {
    const { orders, totalCount } = await listOrders({
      status: status ?? "ALL",
      urgency: urgency ?? "ALL",
      category_text: searchParams.get("category_text") ?? undefined,
      size: searchParams.get("size") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      date_from: searchParams.get("date_from") ?? undefined,
      date_to: searchParams.get("date_to") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      page_size: searchParams.get("page_size")
        ? Number(searchParams.get("page_size"))
        : undefined,
    });
    return NextResponse.json({ orders, totalCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to load orders. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = orderInputSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Please check the form and try again.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  try {
    const order = await createOrder(parsed.data);
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to save order. Your entered information has not been cleared." },
      { status: 500 }
    );
  }
}
