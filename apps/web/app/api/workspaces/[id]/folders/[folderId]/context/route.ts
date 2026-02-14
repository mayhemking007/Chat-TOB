import { proxyToApi } from "@/lib/api-proxy";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string; folderId: string }> }
) {
  const { id, folderId } = await context.params;
  const path = `/workspaces/${encodeURIComponent(id)}/folders/${encodeURIComponent(folderId)}/context`;
  return proxyToApi(_req, "GET", path);
}
