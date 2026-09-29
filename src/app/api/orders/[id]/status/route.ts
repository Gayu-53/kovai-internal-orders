import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/orders";
import { statusUpdateSchema } from "@/lib/validation";

export async function PATCH(
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

  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please select a valid status." }, { status: 400 });
  }

  try {
    const order = await updateOrderStatus(id, parsed.data.production_status);
    return NextResponse.json({ order });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to update status. Please try again." },
      { status: 500 }
    );
  }
}
