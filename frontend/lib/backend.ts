import { cookies } from "next/headers";

/** Server-only calls keep the bearer token outside browser JavaScript. */
export async function backendGet(
  path: string,
): Promise<{ status: number; data: unknown }> {
  const token = (await cookies()).get("enterprise_session")?.value;
  if (!token) return { status: 401, data: null };
  try {
    const response = await fetch(
      `${process.env.BACKEND_URL ?? "http://127.0.0.1:3001"}${path}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    return {
      status: response.status,
      data: await response.json().catch(() => null),
    };
  } catch {
    return { status: 503, data: null };
  }
}
