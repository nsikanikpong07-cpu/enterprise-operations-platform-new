import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sameOrigin } from "../../../../../lib/origin";

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
  const body: Record<string, string> = {};

  if (typeof values.name === "string") {
    body.name = values.name;
  }

  if (typeof values.code === "string") {
    body.code = values.code;
  }

  const { id } = await params;

  try {
    const response = await fetch(
      `${process.env.BACKEND_URL ?? "https://enterprise-operations-platform-new.onrender.com"}/organization/departments/${encodeURIComponent(id)}`,
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
        { message: result?.message ?? "Could not update department." },
        { status: response.status },
      );
    }

    return NextResponse.json({ message: "Department updated." });
  } catch {
    return NextResponse.json(
      {
        message:
          "The connection was interrupted. Refresh the page to check whether the change was saved.",
      },
      { status: 503 },
    );
  }
}
