import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { currentCompany } from "../../../lib/company";
import { sameOrigin } from "../../../lib/origin";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Request origin is not allowed." }, { status: 403 });
  const token = (await cookies()).get("enterprise_session")?.value;
  if (!token) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  const current = await currentCompany();
  if (!current.company) return NextResponse.json({ message: "Company workspace unavailable." }, { status: current.status === 200 ? 403 : current.status });
  let input: Record<string, unknown>;
  try { const body: unknown = await request.json(); if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error(); input = body as Record<string, unknown>; }
  catch { return NextResponse.json({ message: "Invalid request." }, { status: 400 }); }
  try {
    const response = await fetch(`${process.env.BACKEND_URL ?? "http://127.0.0.1:3001"}/procurement/requisitions`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ companyId: current.company.id, requisitionNumber: input.requisitionNumber, justification: input.justification, currency: input.currency, ...(input.departmentId ? { departmentId: input.departmentId } : {}), ...(input.requiredDate ? { requiredDate: input.requiredDate } : {}), items: input.items }), cache: "no-store" });
    const result = await response.json().catch(() => null);
    return NextResponse.json({ message: response.ok ? "Requisition created." : (result?.message ?? "Could not create requisition.") }, { status: response.status });
  } catch { return NextResponse.json({ message: "Connection interrupted. Refresh the list to check whether the requisition was created before trying again." }, { status: 503 }); }
}
