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
<<<<<<< HEAD
        `${process.env.BACKEND_URL}/auth/logout`,
=======
        `${process.env.FRONTEND_URL ?? ""}/auth/logout`,
>>>>>>> 110f2d39419ae10baff03054aff98ac41442dfa9
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
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  return NextResponse.redirect(`${proto}://${host}/login`, 303);
}
