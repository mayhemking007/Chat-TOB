"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Workspace = { id: string; name: string; ownerId: string; createdAt: string };

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/workspaces/${encodeURIComponent(id)}`);
      if (cancelled) return;
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.status === 403 || res.status === 404) {
        router.replace("/");
        return;
      }
      if (!res.ok) {
        setError("Failed to load workspace");
        return;
      }
      const data = await res.json();
      setWorkspace(data);
      // Set as last active workspace
      await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastActiveWorkspaceId: data.id }),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (!id) {
    router.replace("/");
    return null;
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 text-sm text-gray-600 hover:underline"
        >
          Back to home
        </button>
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-gray-600">Loading workspace…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">{workspace.name}</h1>
      <p className="mt-2 text-gray-600">
        Workspace home — Phase 2 will add folders and bots.
      </p>
    </main>
  );
}
