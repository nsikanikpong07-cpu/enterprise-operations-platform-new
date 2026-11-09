import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sameOrigin } from "../../../lib/origin";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function handleChange(request: Request, remove: boolean) {
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

  if (
    typeof input !== "object" ||
    input === null ||
    !("roleId" in input) ||
    !("permissionId" in input) ||
    typeof input.roleId !== "string" ||
    typeof input.permissionId !== "string" ||
    !uuidPattern.test(input.roleId) ||
    !uuidPattern.test(input.permissionId)
  ) {
    return NextResponse.json(
      { message: "A valid role and permission are required." },
      { status: 400 },
    );
  }

  const roleId = input.roleId;
  const permissionId = input.permissionId;

  const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:3001";

  const path = remove
    ? `/iam/roles/${encodeURIComponent(roleId)}/permissions/${encodeURIComponent(permissionId)}`
    : "/iam/roles/grant-permission";

  try {
    const response = await fetch(`${backendUrl}${path}`, {
      method: remove ? "DELETE" : "POST",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },

      ...(remove
        ? {}
        : {
            body: JSON.stringify({
              roleId,
              permissionId,
            }),
          }),

      cache: "no-store",
    });

    if (response.ok) {
      return NextResponse.json({
        message: remove ? "Permission removed." : "Permission granted.",
      });
    }

    const result = await response.json().catch(() => null);

    const message = Array.isArray(result?.message)
      ? result.message.join(" ")
      : typeof result?.message === "string"
        ? result.message
        : "The permission change was rejected.";

    return NextResponse.json({ message }, { status: response.status });
  } catch {
    // The request may have reached the backend before the connection failed.
    return NextResponse.json(
      {
        message:
          "The connection was interrupted. Refresh the page to check the current permission status before trying again.",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  return handleChange(request, false);
}

export async function DELETE(request: Request) {
  return handleChange(request, true);
}
