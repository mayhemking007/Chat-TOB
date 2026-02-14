"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Bot = {
  id: string;
  folderId: string;
  name: string;
  description: string | null;
  purpose: string | null;
  type: string;
  createdAt: string;
  selectedContextIds?: string[];
};

export default function BotViewPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const botId = params.botId as string;
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workspaceId || !botId) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/bots/${encodeURIComponent(botId)}`,
        { credentials: "include" }
      );
      if (cancelled) return;
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.status === 403 || res.status === 404) {
        setError("Bot not found");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError("Failed to load bot");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setBot(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, botId, router]);

  const workspaceUrl = `/workspaces/${workspaceId}`;

  if (!workspaceId || !botId) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Invalid workspace or bot.</p>
        <Link href="/" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
          Go home
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading bot…</p>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="p-6">
        <p className="text-gray-600">{error || "Bot not found"}</p>
        <Link href={workspaceUrl} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
          Back to workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900">Chat with {bot.name}</h1>
      {bot.description && (
        <p className="mt-1 text-sm text-gray-600">{bot.description}</p>
      )}
      <p className="mt-4 text-sm text-gray-500">
        Phase 4 will add the chat interface here.
      </p>
      <Link
        href={workspaceUrl}
        className="mt-4 inline-block text-sm text-gray-600 hover:text-gray-900 hover:underline"
      >
        Back to workspace
      </Link>
    </div>
  );
}
