import { sameOrigin } from "../../../lib/origin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// The backend remains responsible for validating credentials and permissions.
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { message: "Request origin is not allowed." },
      { status: 403 },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  const baseUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:3001";
  try {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      return NextResponse.json(
        {
          message:
            typeof result.message === "string"
              ? result.message
              : "Sign in failed.",
        },
        { status: response.status },
      );
    if (typeof result.accessToken !== "string")
      return NextResponse.json(
        { message: "Invalid response from authentication service." },
        { status: 502 },
      );
    const jar = await cookies();
    jar.set("enterprise_session", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: "Authentication service is unavailable." },
      { status: 503 },
    );
  }
}
