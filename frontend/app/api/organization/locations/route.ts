import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { currentCompany } from "../../../../lib/company";
import { sameOrigin } from "../../../../lib/origin";

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

  if (
    !input ||
    typeof input !== "object" ||
    !("name" in input) ||
    !("code" in input) ||
    typeof input.name !== "string" ||
    typeof input.code !== "string" ||
    !input.name.trim() ||
    !input.code.trim()
  ) {
    return NextResponse.json(
      { message: "Location name and code are required." },
      { status: 400 },
    );
  }

  const values = input as Record<string, unknown>;

  try {
    const response = await fetch(
      `${process.env.BACKEND_URL ?? "https://enterprise-operations-platform-new.onrender.com"}/organization/locations`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: current.company.id,
          name: input.name.trim(),
          code: input.code.trim(),
          ...(typeof values.type === "string" && values.type
            ? { type: values.type }
            : {}),
          ...(typeof values.address === "string" && values.address.trim()
            ? { address: values.address.trim() }
            : {}),
          ...(typeof values.city === "string" && values.city.trim()
            ? { city: values.city.trim() }
            : {}),
          ...(typeof values.state === "string" && values.state.trim()
            ? { state: values.state.trim() }
            : {}),
        }),
        cache: "no-store",
      },
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { message: result?.message ?? "Could not add location." },
        { status: response.status },
      );
    }

    return NextResponse.json({ message: "Location added." });
  } catch {
    return NextResponse.json(
      {
        message:
          "The connection was interrupted. Refresh the page to check whether the location was created.",
      },
      { status: 503 },
    );
  }
}
