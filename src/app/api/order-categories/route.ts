import { NextResponse } from "next/server";
import { getDistinctCategoryTexts } from "@/lib/orders";

export async function GET() {
  try {
    const categories = await getDistinctCategoryTexts();
    return NextResponse.json({ categories });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unable to load categories." }, { status: 500 });
  }
}
