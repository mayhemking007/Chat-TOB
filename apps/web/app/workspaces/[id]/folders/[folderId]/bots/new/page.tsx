"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type ContextItem = {
  id: string;
  workspaceId: string;
  folderId: string;
  title: string;
  summary: string;
  sourceBotId: string | null;
  sourceFolderPath: string | null;
  createdAt: string;
};

type BotType = "fresh" | "context_aware";

export default function NewBotPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const folderId = params.folderId as string;

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [type, setType] = useState<BotType>("fresh");
  const [contextList, setContextList] = useState<ContextItem[]>([]);
  const [contextLoading, setContextLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchContext = useCallback(async () => {
    if (!workspaceId || !folderId) return;
    setContextLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/folders/${encodeURIComponent(folderId)}/context`,
        { credentials: "include" }
      );
      const data = await res.json().catch(() => []);
      setContextList(Array.isArray(data) ? data : []);
    } catch {
      setContextList([]);
    } finally {
      setContextLoading(false);
    }
  }, [workspaceId, folderId]);

  useEffect(() => {
    if (step === 2 && type === "context_aware") {
      fetchContext();
    }
  }, [step, type, fetchContext]);

  const toggleContext = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStep1Next = () => {
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    if (type !== "context_aware") return;
    setStep(2);
  };

  const handleCreateFromStep1 = async () => {
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    if (type !== "fresh") return;
    await submitCreate(trimmed, []);
  };

  const submitCreate = async (botName: string, contextIds: string[]) => {
    setSubmitting(true);
    setError("");
    try {
      const body: {
        name: string;
        description?: string | null;
        purpose?: string | null;
        type: BotType;
        contextIds?: string[];
      } = {
        name: botName,
        description: description.trim() || null,
        purpose: purpose.trim() || null,
        type,
      };
      if (type === "context_aware" && contextIds.length > 0) {
        body.contextIds = contextIds;
      }
      const res = await fetch(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/folders/${encodeURIComponent(folderId)}/bots`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to create bot");
        setSubmitting(false);
        return;
      }
      const createdId = data?.id;
      if (createdId) {
        router.replace(`/workspaces/${workspaceId}/bot/${createdId}`);
      } else {
        router.replace(`/workspaces/${workspaceId}`);
      }
    } catch {
      setError("Something went wrong");
      setSubmitting(false);
    }
  };

  const handleCreateFromStep2 = async () => {
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    await submitCreate(trimmed, Array.from(selectedIds));
  };

  const workspaceUrl = `/workspaces/${workspaceId}`;

  if (!workspaceId || !folderId) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Invalid workspace or folder.</p>
        <Link href="/" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
          Go home
        </Link>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="p-6 max-w-lg">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Create bot</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (type === "context_aware") handleStep1Next();
            else handleCreateFromStep1();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="bot-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="bot-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bot name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="bot-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              id="bot-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="bot-purpose" className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <input
              id="bot-purpose"
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. SOP, code review"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">Type</legend>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="fresh"
                  checked={type === "fresh"}
                  onChange={() => setType("fresh")}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Fresh bot (no context)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="context_aware"
                  checked={type === "context_aware"}
                  onChange={() => setType("context_aware")}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Context-aware bot</span>
              </label>
            </div>
          </fieldset>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Link
              href={workspaceUrl}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            {type === "context_aware" ? (
              <button
                type="button"
                onClick={handleStep1Next}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? "Creating…" : "Create bot"}
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Create bot</h1>
      <p className="text-sm text-gray-600 mb-4">Select context to attach (optional). No pre-selection.</p>
      {contextLoading ? (
        <p className="text-sm text-gray-500 py-4">Loading context…</p>
      ) : contextList.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">
          No context available in this folder or its parents. You can still create the bot and add context later.
        </p>
      ) : (
        <ul className="space-y-2 mb-6">
          {contextList.map((ctx) => (
            <li
              key={ctx.id}
              className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50/50"
            >
              <input
                type="checkbox"
                id={`ctx-${ctx.id}`}
                checked={selectedIds.has(ctx.id)}
                onChange={() => toggleContext(ctx.id)}
                className="mt-1 rounded border-gray-300"
              />
              <label htmlFor={`ctx-${ctx.id}`} className="flex-1 min-w-0 cursor-pointer">
                <span className="font-medium text-gray-900 block truncate">{ctx.title}</span>
                <span className="text-sm text-gray-600 line-clamp-2">{ctx.summary}</span>
                {ctx.sourceFolderPath && (
                  <span className="text-xs text-gray-400 block mt-0.5">{ctx.sourceFolderPath}</span>
                )}
              </label>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleCreateFromStep2}
          disabled={submitting}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create bot"}
        </button>
      </div>
    </div>
  );
}
