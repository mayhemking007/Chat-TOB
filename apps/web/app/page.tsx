"use client";

import { Navbar } from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Workspace = { id: string; name: string; ownerId: string; createdAt: string };
type Me = { id: string; email: string; name: string | null; lastActiveWorkspaceId: string | null };

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showCreateForm = searchParams.get("create") === "workspace";
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      const [wRes, mRes] = await Promise.all([
        fetch("/api/workspaces", { credentials: "include" }),
        fetch("/api/me", { credentials: "include" }),
      ]);
      if (cancelled) return;
      if (wRes.status === 401 || mRes.status === 401) {
        router.replace("/login");
        return;
      }
      const wData = wRes.ok ? await wRes.json() : [];
      const mData = mRes.ok ? await mRes.json() : null;
      setWorkspaces(Array.isArray(wData) ? wData : []);
      setMe(mData);
    })();
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || workspaces === null || me === null) return;
    if (workspaces.length === 0) return;
    if (showCreateForm) return;
    const targetId =
      me.lastActiveWorkspaceId && workspaces.some((w) => w.id === me.lastActiveWorkspaceId)
        ? me.lastActiveWorkspaceId
        : workspaces[0].id;
    router.replace(`/workspaces/${targetId}`);
  }, [status, workspaces, me, router, showCreateForm]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data?.error ?? "Failed to create workspace");
        setCreating(false);
        return;
      }
      const createdId = data?.id;
      if (!createdId) {
        setCreateError("Invalid response from server");
        setCreating(false);
        return;
      }
      await fetch("/api/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastActiveWorkspaceId: createdId }),
      });
      router.push(`/workspaces/${createdId}`);
      return;
    } catch {
      setCreateError("Something went wrong");
    }
    setCreating(false);
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-gray-600">Loading…</p>
      </main>
    );
  }

  if (!session?.user) {
    router.replace("/login");
    return null;
  }

  if (workspaces === null || me === null) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-gray-600">Loading…</p>
      </main>
    );
  }

  if (workspaces.length > 0 && !showCreateForm) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-gray-600">Redirecting to workspace…</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-2xl font-semibold">
            {showCreateForm ? "Create workspace" : "Create workspace to get started"}
          </h1>
          <p className="text-gray-600">{showCreateForm
              ? "Add a new workspace to organize your folders and bots."
              : "You don't have any workspaces yet. Create one to continue."}
          </p>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="Workspace name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
              minLength={1}
            />
            {createError && <p className="text-sm text-red-600">{createError}</p>}
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create workspace"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
