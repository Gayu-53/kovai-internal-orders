import { NextResponse } from "next/server";
import { getDistinctSizes } from "@/lib/orders";

export async function GET() {
  try {
    const sizes = await getDistinctSizes();
    return NextResponse.json({ sizes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unable to load sizes." }, { status: 500 });
  }
}
