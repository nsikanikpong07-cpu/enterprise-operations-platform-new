import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sameOrigin } from "../../../../../lib/origin";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function mutate(request: Request, { params }: { params: Promise<{ id: string }> }, method: "POST" | "DELETE") {
 if (!sameOrigin(request)) return NextResponse.json({ message: "Request origin is not allowed." }, { status: 403 });
 const token = (await cookies()).get("enterprise_session")?.value;
 if (!token) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
 const { id } = await params; let roleId: unknown;
 try { roleId = (await request.json()).roleId; } catch { return NextResponse.json({ message: "Invalid request." }, { status: 400 }); }
 if (!uuid.test(id) || typeof roleId !== "string" || !uuid.test(roleId)) return NextResponse.json({ message: "Invalid role or staff member." }, { status: 400 });
 const path = method === "POST" ? "/iam/user-roles" : `/iam/user-roles/${encodeURIComponent(id)}/${encodeURIComponent(roleId)}`;
 try {
  const response = await fetch(`${process.env.BACKEND_URL ?? "https://enterprise-operations-platform-new.onrender.com"}${path}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(method === "POST" ? { body: JSON.stringify({ companyUserId: id, roleId }) } : {}), cache: "no-store" });
  const data = await response.json().catch(() => null);
  return NextResponse.json({ message: response.ok ? (method === "POST" ? "Role assigned." : "Role removed.") : data?.message ?? "Could not update the role." }, { status: response.ok ? 200 : response.status });
 } catch { return NextResponse.json({ message: "Connection interrupted. Refresh to check the result." }, { status: 503 }); }
}
export function POST(request: Request, context: { params: Promise<{ id: string }> }) { return mutate(request, context, "POST"); }
export function DELETE(request: Request, context: { params: Promise<{ id: string }> }) { return mutate(request, context, "DELETE"); }
