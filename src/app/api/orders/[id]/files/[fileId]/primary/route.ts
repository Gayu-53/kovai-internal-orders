import { NextRequest, NextResponse } from "next/server";
import { setPrimaryFile } from "@/lib/orders";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id: orderId, fileId } = await params;

  try {
    await setPrimaryFile(orderId, fileId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unable to update primary file." }, { status: 500 });
  }
}
