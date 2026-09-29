import { NextRequest, NextResponse } from "next/server";
import { getSalesSummary } from "@/lib/orders";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  try {
    const summary = await getSalesSummary({
      date_from: searchParams.get("date_from") ?? undefined,
      date_to: searchParams.get("date_to") ?? undefined,
    });
    return NextResponse.json({ summary });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to load sales summary." },
      { status: 500 }
    );
  }
}
