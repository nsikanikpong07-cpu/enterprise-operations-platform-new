import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sameOrigin } from "../../../lib/origin";
import { currentCompany } from "../../../lib/company";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { message: "Request origin is not allowed." },
      { status: 403 },
    );
  const token = (await cookies()).get("enterprise_session")?.value;
  if (!token)
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  const current = await currentCompany();
  if (!current.company)
    return NextResponse.json(
      { message: "Company workspace unavailable." },
      { status: current.status === 200 ? 403 : current.status },
    );
  let data: { name?: unknown; description?: unknown };
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  if (
    typeof data.name !== "string" ||
    !data.name.trim() ||
    data.name.length > 100 ||
    (data.description !== undefined && typeof data.description !== "string")
  )
    return NextResponse.json(
      { message: "Enter a valid role name and description." },
      { status: 400 },
    );
  try {
    const response = await fetch(
      `${process.env.BACKEND_URL ?? "https://enterprise-operations-platform-new.onrender.com"}/iam/roles`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: current.company.id,
          name: data.name.trim(),
          ...(data.description ? { description: data.description } : {}),
        }),
        cache: "no-store",
      },
    );
    const result = await response.json().catch(() => ({}));
    return NextResponse.json(
      response.ok
        ? { message: "Role created." }
        : { message: result.message ?? "Could not create role." },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      { message: "The service is unavailable." },
      { status: 503 },
    );
  }
}
