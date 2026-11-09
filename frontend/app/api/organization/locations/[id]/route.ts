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
  const body: Record<string, string | boolean> = {};

  if (typeof values.name === "string") {
    body.name = values.name;
  }

  if (typeof values.address === "string") {
    body.address = values.address;
  }

  if (typeof values.isActive === "boolean") {
    body.isActive = values.isActive;
  }

  const { id } = await params;

  try {
    const response = await fetch(
      `${process.env.BACKEND_URL ?? "http://127.0.0.1:3001"}/organization/locations/${encodeURIComponent(id)}`,
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
        { message: result?.message ?? "Could not update location." },
        { status: response.status },
      );
    }

    return NextResponse.json({ message: "Location updated." });
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
