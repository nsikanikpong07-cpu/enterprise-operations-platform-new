import { sameOrigin } from "../../../lib/origin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { message: "Request origin is not allowed." },
      { status: 403 },
    );
  const jar = await cookies();
  const token = jar.get("enterprise_session")?.value;
  if (token) {
    try {
      await fetch(
        `${process.env.BACKEND_URL_OUT ?? "https://enterprise-operations-platform-new.onrender.com"}/auth/logout`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
    } catch {
      /* Clear the local session even when the service is unavailable. */
    }
  }
  jar.delete("enterprise_session");
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
