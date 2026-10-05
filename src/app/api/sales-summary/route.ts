import { NextRequest, NextResponse } from "next/server";
import { getSalesSummary } from "@/lib/orders";

const OWNER_COOKIE = "owner_access";

export async function GET(req: NextRequest) {
  const ownerAccess = req.cookies.get(OWNER_COOKIE)?.value;

  if (ownerAccess !== "authorized") {
    return NextResponse.json(
      { error: "Owner access required." },
      { status: 401 }
    );
  }

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