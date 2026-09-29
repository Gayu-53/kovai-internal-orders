import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/orders";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ stats });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unable to load stats." }, { status: 500 });
  }
}
