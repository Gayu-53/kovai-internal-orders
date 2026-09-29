import { NextRequest, NextResponse } from "next/server";
import { deleteOrderFile } from "@/lib/orders";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { fileId } = await params;

  try {
    await deleteOrderFile(fileId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unable to remove file." }, { status: 500 });
  }
}
