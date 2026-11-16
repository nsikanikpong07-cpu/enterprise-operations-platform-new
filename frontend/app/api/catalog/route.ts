import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sameOrigin } from "../../../lib/origin";
import { currentCompany } from "../../../lib/company";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Request origin is not allowed." }, { status: 403 });
  const token = (await cookies()).get("enterprise_session")?.value;
  if (!token) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  const current = await currentCompany();
  if (!current.company) return NextResponse.json({ message: "Company workspace unavailable." }, { status: current.status === 200 ? 403 : current.status });
  let input: Record<string, unknown>;
  try { const value: unknown = await request.json(); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(); input = value as Record<string, unknown>; }
  catch { return NextResponse.json({ message: "Invalid request." }, { status: 400 }); }
  const { action, data } = input;
  if (!data || typeof data !== "object" || Array.isArray(data)) return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  const d = data as Record<string, unknown>;
  let path: string; let method: string; let payload: Record<string, unknown>;
  if (action === "createItem") {
    if (typeof d.name !== "string" || !d.name.trim() || typeof d.unitOfMeasureId !== "string" || !d.unitOfMeasureId || !["material", "service", "asset"].includes(String(d.itemType)) || typeof d.isStockable !== "boolean") return NextResponse.json({ message: "Enter a name, unit and valid item type." }, { status: 400 });
    path = "/catalog/items"; method = "POST";
    payload = { companyId: current.company.id, name: d.name.trim(), unitOfMeasureId: d.unitOfMeasureId, itemType: d.itemType, isStockable: d.isStockable, ...(typeof d.sku === "string" && d.sku.trim() ? { sku: d.sku.trim() } : {}), ...(typeof d.categoryId === "string" && d.categoryId ? { categoryId: d.categoryId } : {}) };
  } else if (action === "createCategory") {
    if (typeof d.name !== "string" || !d.name.trim()) return NextResponse.json({ message: "Enter a category name." }, { status: 400 });
    path = "/catalog/categories"; method = "POST"; payload = { companyId: current.company.id, name: d.name.trim(), ...(typeof d.parentId === "string" && d.parentId ? { parentId: d.parentId } : {}) };
  } else if (action === "setStatus") {
    if (typeof d.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.id) || typeof d.isActive !== "boolean") return NextResponse.json({ message: "Invalid item status." }, { status: 400 });
    path = `/catalog/items/${encodeURIComponent(d.id)}`; method = "PATCH"; payload = { isActive: d.isActive };
  } else return NextResponse.json({ message: "Invalid action." }, { status: 400 });
  try {
    const response = await fetch(`${process.env.BACKEND_URL ?? "http://127.0.0.1:3001"}${path}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
    const result = await response.json().catch(() => null);
    return NextResponse.json({ message: response.ok ? "Saved successfully." : (result?.message ?? "The action could not be completed.") }, { status: response.status });
  } catch { return NextResponse.json({ message: "Connection interrupted. Refresh to check the result before trying again." }, { status: 503 }); }
}
