import { proxyToApi } from "@/lib/api-proxy";

export async function GET(req: Request) {
  return proxyToApi(req, "GET", "/workspaces");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyToApi(req, "POST", "/workspaces", body);
}
