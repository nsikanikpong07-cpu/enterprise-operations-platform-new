import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sameOrigin } from "../../../../lib/origin";
import { currentCompany } from "../../../../lib/company";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { message: "Request origin is not allowed." },
      { status: 403 },
    );
  }

  const token = (await cookies()).get("enterprise_session")?.value;

  if (!token) {
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  }

  const current = await currentCompany();

  if (!current.company) {
    return NextResponse.json(
      { message: "Company workspace unavailable." },
      { status: current.status === 200 ? 403 : current.status },
    );
  }

  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const values = input as Record<string, unknown>;

  if (
    typeof values.name !== "string" ||
    !values.name.trim() ||
    values.name.length > 150 ||
    (values.code !== undefined && typeof values.code !== "string") ||
    (typeof values.code === "string" && values.code.length > 50) ||
    (values.managerId !== undefined && typeof values.managerId !== "string")
  ) {
    return NextResponse.json(
      { message: "Enter a valid department name, code and manager." },
      { status: 400 },
    );
  }

  const code = typeof values.code === "string" ? values.code.trim() : "";

  const managerId =
    typeof values.managerId === "string" ? values.managerId.trim() : "";

  try {
    const response = await fetch(
      `${process.env.BACKEND_URL ?? "http://127.0.0.1:3001"}/organization/departments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: current.company.id,
          name: values.name.trim(),
          ...(code ? { code } : {}),
          ...(managerId ? { managerId } : {}),
        }),
        cache: "no-store",
      },
    );

    const result = await response.json().catch(() => null);

    return NextResponse.json(
      {
        message: response.ok
          ? "Department created."
          : (result?.message ?? "Could not create department."),
      },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      {
        message:
          "The connection was interrupted. Refresh the page to check whether the department was created.",
      },
      { status: 503 },
    );
  }
}
