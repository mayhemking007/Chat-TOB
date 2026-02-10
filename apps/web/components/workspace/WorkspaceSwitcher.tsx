"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Workspace = { id: string; name: string; ownerId: string; createdAt: string };

export function WorkspaceSwitcher() {
  const params = useParams();
  const router = useRouter();
  const currentId = params.id as string;
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/workspaces", { credentials: "include" });
      if (cancelled) return;
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.status === 200) {
        const data = await res.json();
        setWorkspaces(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Current workspace not in list (e.g. deleted) → go home
  useEffect(() => {
    if (loading || workspaces.length === 0 || !currentId) return;
    if (!workspaces.some((w) => w.id === currentId)) {
      router.replace("/");
    }
  }, [loading, workspaces, currentId, router]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId || selectedId === currentId) return;
    await fetch("/api/me", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastActiveWorkspaceId: selectedId }),
    });
    router.push(`/workspaces/${selectedId}`);
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500 truncate px-2 py-1.5">
        Loading…
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="text-sm text-gray-500 px-2 py-1.5">
        No workspaces
      </div>
    );
  }

  return (
    <select
      value={currentId}
      onChange={handleChange}
      className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm font-medium text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
      aria-label="Switch workspace"
    >
      {workspaces.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </select>
  );
}
