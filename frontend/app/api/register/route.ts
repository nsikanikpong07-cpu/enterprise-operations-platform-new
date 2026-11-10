import { sameOrigin } from "../../../lib/origin";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Request origin is not allowed." }, { status: 403 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid request." }, { status: 400 }); }
  try { const response = await fetch(`${process.env.BACKEND_URL ?? "https://enterprise-operations-platform-new.onrender.com"}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" }); const result = await response.json().catch(() => ({})); return NextResponse.json(response.ok ? { message: "Registration completed." } : { message: result.message ?? "Registration failed." }, { status: response.status }); }
  catch { return NextResponse.json({ message: "Registration service is unavailable." }, { status: 503 }); }
}
