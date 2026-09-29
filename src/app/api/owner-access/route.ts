import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body.password ?? "");

    const ownerPassword = process.env.OWNER_ACCESS_PASSWORD;

    if (!ownerPassword) {
      return NextResponse.json(
        { success: false, message: "Owner password is not configured." },
        { status: 500 }
      );
    }

    if (password !== ownerPassword) {
      return NextResponse.json(
        { success: false, message: "Incorrect owner password." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request." },
      { status: 400 }
    );
  }
}