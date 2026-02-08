import { proxyToApi } from "@/lib/api-proxy";

export async function GET(req: Request) {
  return proxyToApi(req, "GET", "/auth/me");
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyToApi(req, "PATCH", "/users/me", body);
}
