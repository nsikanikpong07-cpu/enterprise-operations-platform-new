import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sameOrigin } from "../../../../lib/origin";

const backend = () => process.env.BACKEND_URL ?? "http://127.0.0.1:3001";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ message: "Request origin is not allowed." }, { status: 403 });
  }
  const token = (await cookies()).get("enterprise_session")?.value;
  if (!token) return NextResponse.json({ message: "Please sign in." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  try {
    const response = await fetch(`${backend()}/vendor/me/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Supplier service unavailable." }, { status: 503 });
  }
}
