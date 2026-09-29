import { NextRequest, NextResponse } from "next/server";
import { addOrderFile, getOrderById, uploadOrderFileBlob } from "@/lib/orders";
import { validateOrderFile } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const validationError = validateOrderFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const isPrimary = formData.get("is_primary") === "true";
  const existingCount = order.files?.length ?? 0;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = await uploadOrderFileBlob(
      orderId,
      buffer,
      file.type || "application/octet-stream",
      file.name
    );
    const savedFile = await addOrderFile(
      orderId,
      storagePath,
      file.name,
      file.type || "application/octet-stream",
      file.size,
      isPrimary || existingCount === 0,
      existingCount
    );
    return NextResponse.json({ file: savedFile }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "File upload failed. Please try again." },
      { status: 500 }
    );
  }
}
