import { proxyToApi } from "@/lib/api-proxy";

function getPath(id: string, folderId: string): string {
  return `/workspaces/${encodeURIComponent(id)}/folders/${encodeURIComponent(folderId)}/bots`;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string; folderId: string }> }
) {
  const { id, folderId } = await context.params;
  return proxyToApi(_req, "GET", getPath(id, folderId));
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string; folderId: string }> }
) {
  try {
    const { id, folderId } = await context.params;
    const body = await req.json().catch(() => ({}));
    return proxyToApi(req, "POST", getPath(id, folderId), body);
  } catch (err) {
    console.error("[api/workspaces/[id]/folders/[folderId]/bots] POST error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
