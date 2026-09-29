import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/lib/orders";
import { orderInputSchema } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unable to load order." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = orderInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Please check the form and try again.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  try {
    const order = await updateOrder(id, parsed.data);
    return NextResponse.json({ order });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to save changes. Your entered information has not been cleared." },
      { status: 500 }
    );
  }
}
