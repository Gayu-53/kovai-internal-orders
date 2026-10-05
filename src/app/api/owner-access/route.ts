import { NextRequest, NextResponse } from "next/server";

const OWNER_COOKIE = "owner_access";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password = String(body?.password ?? "");

    const ownerPassword = process.env.OWNER_ACCESS_PASSWORD;

    if (!ownerPassword) {
      console.error("OWNER_ACCESS_PASSWORD is not configured.");
      return NextResponse.json(
        { error: "Owner access is not configured." },
        { status: 500 }
      );
    }

    if (!password || password !== ownerPassword) {
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: OWNER_COOKIE,
      value: "authorized",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Owner access error:", error);

    return NextResponse.json(
      { error: "Unable to verify owner access." },
      { status: 500 }
    );
  }
}