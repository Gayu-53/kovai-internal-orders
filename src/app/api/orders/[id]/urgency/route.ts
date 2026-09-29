import { NextRequest, NextResponse } from "next/server";
import { updateOrderUrgency } from "@/lib/orders";
import { urgencyUpdateSchema } from "@/lib/validation";

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

  const parsed = urgencyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please select a valid priority." }, { status: 400 });
  }

  try {
    const order = await updateOrderUrgency(id, parsed.data.urgency);
    return NextResponse.json({ order });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to update priority. Please try again." },
      { status: 500 }
    );
  }
}
