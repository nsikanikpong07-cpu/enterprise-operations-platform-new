import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sameOrigin } from "../../../../lib/origin";

export async function DELETE(
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

  const { id } = await params;

  try {
    const response = await fetch(
      `${process.env.BACKEND_URL ?? "https://enterprise-operations-platform-new.onrender.com"}/iam/roles/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { message: result?.message ?? "Could not delete this role." },
        { status: response.status },
      );
    }

    return NextResponse.json({ message: "Role deleted." });
  } catch {
    return NextResponse.json(
      {
        message:
          "The connection was interrupted. Refresh the roles list to check whether the role was deleted.",
      },
      { status: 503 },
    );
  }
}
