/**
 * Get NextAuth session JWT from request cookies for proxying to Express API.
 */
export function getSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match =
    cookieHeader.match(/(?:^|;)\s*__Secure-next-auth\.session-token=([^;]+)/) ??
    cookieHeader.match(/(?:^|;)\s*next-auth\.session-token=([^;]+)/);
  return match?.[1]?.trim() ?? null;
}

export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function proxyToApi(
  req: Request,
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown
): Promise<Response> {
  const token = getSessionToken(req);
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const url = `${apiUrl}${path}`;
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  if (body !== undefined) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return new Response(JSON.stringify(data ?? {}), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
