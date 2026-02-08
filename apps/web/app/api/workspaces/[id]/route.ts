import { proxyToApi } from "@/lib/api-proxy";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToApi(req, "GET", `/workspaces/${encodeURIComponent(id)}`);
}
