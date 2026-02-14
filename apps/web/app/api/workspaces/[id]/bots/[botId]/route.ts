import { proxyToApi } from "@/lib/api-proxy";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string; botId: string }> }
) {
  const { id, botId } = await context.params;
  const path = `/workspaces/${encodeURIComponent(id)}/bots/${encodeURIComponent(botId)}`;
  return proxyToApi(_req, "GET", path);
}
