/** Browser writes require the same origin as the Host header. Configure a trusted
 * reverse proxy to reject unrecognised Host values in deployments. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.host.toLowerCase() === host.toLowerCase()
    );
  } catch {
    return false;
  }
}
