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
      const res = await fetch(`/api/workspaces/${encodeURIComponent(id)}`, {
        credentials: "include",
      });
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
      await fetch("/api/me", {
        method: "PATCH",
        credentials: "include",
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
      <div className="p-8">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 text-sm text-gray-600 hover:underline"
        >
          Back to home
        </button>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <p className="text-gray-600">Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">{workspace.name}</h1>
      <p className="mt-2 text-gray-600">
        Select a folder or bot in the sidebar to get started.
      </p>
    </div>
  );
}
