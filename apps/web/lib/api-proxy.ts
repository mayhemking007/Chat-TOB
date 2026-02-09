import { getServerSession } from "next-auth";
import jwt from "jsonwebtoken";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Get a JWT for the Express API from the NextAuth session.
 * getServerSession() works with App Router request context; getToken() often returns null
 * with the fetch Request. We then sign a plain HS256 JWT the API can verify.
 */
async function getApiToken(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const token = jwt.sign(
    {
      sub: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name ?? null,
    },
    secret,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  return token;
}

export async function proxyToApi(
  req: Request,
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown
): Promise<Response> {
  const token = await getApiToken();
  if (!token) {
    const body: { error: string; hint?: string } = { error: "Unauthorized" };
    if (process.env.NODE_ENV === "development") {
      body.hint = "No session. Sign in and use same-origin requests with credentials.";
    }
    return new Response(JSON.stringify(body), {
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
  // In dev, if API returns 401, hint that NEXTAUTH_SECRET must match in apps/api
  const out =
    process.env.NODE_ENV === "development" &&
    res.status === 401 &&
    data &&
    typeof data === "object" &&
    !Array.isArray(data)
      ? {
          ...data,
          hint: "API rejected token. Set NEXTAUTH_SECRET in apps/api/.env to the same value as in apps/web/.env.local.",
        }
      : data ?? {};
  return new Response(JSON.stringify(out), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
