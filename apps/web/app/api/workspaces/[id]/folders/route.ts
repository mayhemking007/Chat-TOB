import { proxyToApi } from "@/lib/api-proxy";

function getPathWithQuery(id: string, req: Request): string {
  const path = `/workspaces/${encodeURIComponent(id)}/folders`;
  const url = new URL(req.url);
  const query = url.searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToApi(req, "GET", getPathWithQuery(id, req));
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    return proxyToApi(req, "POST", `/workspaces/${encodeURIComponent(id)}/folders`, body);
  } catch (err) {
    console.error("[api/workspaces/[id]/folders] POST error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
