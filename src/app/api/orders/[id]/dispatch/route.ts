import { NextRequest, NextResponse } from "next/server";
import { upsertDispatchDetails } from "@/lib/orders";
import { dispatchDetailsSchema } from "@/lib/validation";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = dispatchDetailsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the dispatch details." }, { status: 400 });
  }

  try {
    const dispatch = await upsertDispatchDetails(orderId, parsed.data);
    return NextResponse.json({ dispatch });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to save dispatch details. Please try again." },
      { status: 500 }
    );
  }
}
