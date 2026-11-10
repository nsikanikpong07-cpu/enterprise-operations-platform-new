import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sameOrigin } from "../../../../lib/origin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const body: {
    status?: "active" | "inactive";
    departmentId?: string | null;
  } = {};

  if (values.status !== undefined) {
    if (values.status !== "active" && values.status !== "inactive") {
      return NextResponse.json(
        { message: "A valid membership status is required." },
        { status: 400 },
      );
    }

    body.status = values.status;
  }

  if (values.departmentId !== undefined) {
    if (
      values.departmentId !== null &&
      (typeof values.departmentId !== "string" || !values.departmentId.trim())
    ) {
      return NextResponse.json(
        { message: "A valid department is required." },
        { status: 400 },
      );
    }

    body.departmentId =
      typeof values.departmentId === "string"
        ? values.departmentId.trim()
        : null;
  }

  if (Object.keys(body).length === 0) {
    return NextResponse.json(
      { message: "No membership change was provided." },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    const response = await fetch(
      `${process.env.BACKEND_URL ?? "https://enterprise-operations-platform-new.onrender.com"}/iam/company-users/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { message: result?.message ?? "Could not update staff membership." },
        { status: response.status },
      );
    }

    return NextResponse.json({
      message: "Staff membership updated.",
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "The connection was interrupted. Refresh the staff list to check the current details.",
      },
      { status: 503 },
    );
  }
}
