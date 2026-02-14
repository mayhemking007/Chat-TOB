"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export type BotInFolder = {
  id: string;
  folderId: string;
  name: string;
  description: string | null;
  purpose: string | null;
  type: string;
  createdAt: string;
};

export type FolderTreeNode = {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  createdAt: string;
  children: FolderTreeNode[];
};

type CreateFormState = {
  parentId: string | null;
  name: string;
  error: string;
  submitting: boolean;
} | null;

export function FolderTree({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const selectedBotId =
    pathname?.match(/^\/workspaces\/[^/]+\/bot\/([^/]+)$/)?.[1] ?? null;

  const [tree, setTree] = useState<FolderTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [createForm, setCreateForm] = useState<CreateFormState>(null);
  const [botsByFolderId, setBotsByFolderId] = useState<Record<string, BotInFolder[]>>({});
  const [loadingBotsFor, setLoadingBotsFor] = useState<Set<string>>(new Set());

  const fetchTree = useCallback(async () => {
    const res = await fetch(
      `/api/workspaces/${encodeURIComponent(workspaceId)}/folders?tree=1`,
      { credentials: "include" }
    );
    if (!res.ok) {
      setTree([]);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTree(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    fetchTree();
  }, [workspaceId, fetchTree]);

  useEffect(() => {
    if (tree.length > 0 && expanded.size === 0) {
      setExpanded(new Set(tree.map((n) => n.id)));
    }
  }, [tree]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadBotsForFolder = useCallback(
    async (folderId: string, refetch = false) => {
      if (!refetch && (botsByFolderId[folderId] !== undefined || loadingBotsFor.has(folderId)))
        return;
      if (refetch) {
        setBotsByFolderId((prev) => {
          const next = { ...prev };
          delete next[folderId];
          return next;
        });
      }
      setLoadingBotsFor((prev) => new Set(prev).add(folderId));
      try {
        const res = await fetch(
          `/api/workspaces/${encodeURIComponent(workspaceId)}/folders/${encodeURIComponent(folderId)}/bots`,
          { credentials: "include" }
        );
        const data = await res.json().catch(() => []);
        const list = Array.isArray(data) ? data : [];
        setBotsByFolderId((prev) => ({ ...prev, [folderId]: list }));
      } catch {
        setBotsByFolderId((prev) => ({ ...prev, [folderId]: [] }));
      } finally {
        setLoadingBotsFor((prev) => {
          const next = new Set(prev);
          next.delete(folderId);
          return next;
        });
      }
    },
    [workspaceId, botsByFolderId, loadingBotsFor]
  );

  // When viewing a bot, ensure its folder is expanded and bots are loaded (so sidebar shows it)
  useEffect(() => {
    if (!selectedBotId || !workspaceId) return;
    const hasBotInList = Object.values(botsByFolderId).some((bots) =>
      bots.some((b) => b.id === selectedBotId)
    );
    if (hasBotInList) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/bots/${encodeURIComponent(selectedBotId)}`,
        { credentials: "include" }
      );
      if (cancelled || !res.ok) return;
      const bot = await res.json().catch(() => null);
      if (!bot?.folderId) return;
      setExpanded((prev) => new Set(prev).add(bot.folderId));
      loadBotsForFolder(bot.folderId, true);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedBotId, workspaceId, botsByFolderId, loadBotsForFolder]);

  const openCreateForm = (parentId: string | null) => {
    setCreateForm({ parentId, name: "", error: "", submitting: false });
  };

  const closeCreateForm = () => {
    setCreateForm(null);
  };

  const submitCreate = async () => {
    if (!createForm || !createForm.name.trim()) return;
    setCreateForm((f) => f ? { ...f, error: "", submitting: true } : null);
    const body: { name: string; parentId?: string } = { name: createForm.name.trim() };
    if (createForm.parentId) body.parentId = createForm.parentId;
    const res = await fetch(
      `/api/workspaces/${encodeURIComponent(workspaceId)}/folders`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCreateForm((f) =>
        f
          ? {
              ...f,
              error: data?.error ?? "Failed to create folder",
              submitting: false,
            }
          : null
      );
      return;
    }
    closeCreateForm();
    fetchTree();
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500 py-1">
        Loading folders…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => openCreateForm(null)}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline"
        >
          + New folder
        </button>
      </div>
      {createForm !== null && createForm.parentId === null && (
        <CreateFolderForm
          name={createForm.name}
          error={createForm.error}
          submitting={createForm.submitting}
          onNameChange={(name) =>
            setCreateForm((f) => (f ? { ...f, name, error: "" } : null))
          }
          onSubmit={submitCreate}
          onCancel={closeCreateForm}
        />
      )}
      {tree.length === 0 && !createForm ? (
        <p className="text-sm text-gray-500 py-1">No folders</p>
      ) : (
        <ul className="list-none pl-0 space-y-0">
          {tree.map((node) => (
            <FolderRow
              key={node.id}
              node={node}
              depth={0}
              workspaceId={workspaceId}
              expanded={expanded}
              botsByFolderId={botsByFolderId}
              loadingBotsFor={loadingBotsFor}
              selectedBotId={selectedBotId}
              onToggle={toggleExpanded}
              onAddChild={openCreateForm}
              onLoadBots={loadBotsForFolder}
              createForm={createForm}
              onFormChange={setCreateForm}
              onSubmitCreate={submitCreate}
              onCancelCreate={closeCreateForm}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CreateFolderForm({
  name,
  error,
  submitting,
  onNameChange,
  onSubmit,
  onCancel,
}: {
  name: string;
  error: string;
  submitting: boolean;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Folder name"
        className="rounded border border-gray-300 px-2 py-1 text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
          if (e.key === "Escape") onCancel();
        }}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !name.trim()}
          className="text-xs font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function FolderRow({
  node,
  depth,
  workspaceId,
  expanded,
  botsByFolderId,
  loadingBotsFor,
  selectedBotId,
  onToggle,
  onAddChild,
  onLoadBots,
  createForm,
  onFormChange,
  onSubmitCreate,
  onCancelCreate,
}: {
  node: FolderTreeNode;
  depth: number;
  workspaceId: string;
  expanded: Set<string>;
  botsByFolderId: Record<string, BotInFolder[]>;
  loadingBotsFor: Set<string>;
  selectedBotId: string | null;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onLoadBots: (folderId: string, refetch?: boolean) => void;
  createForm: CreateFormState;
  onFormChange: (f: CreateFormState) => void;
  onSubmitCreate: () => void;
  onCancelCreate: () => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isCreatingHere = createForm?.parentId === node.id;
  const botsInFolder = botsByFolderId[node.id] ?? null;
  const loadingBots = loadingBotsFor.has(node.id);

  useEffect(() => {
    if (isExpanded && botsByFolderId[node.id] === undefined) {
      onLoadBots(node.id);
    }
  }, [isExpanded, node.id, botsByFolderId, onLoadBots]);

  return (
    <li className="list-none">
      <div
        className="flex items-center gap-0.5 py-0.5 group"
        style={{ paddingLeft: depth * 12 }}
      >
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-200/80"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
        </button>
        <span className="min-w-0 flex-1 truncate text-sm text-gray-800">
          {node.name}
        </span>
        <Link
          href={`/workspaces/${encodeURIComponent(workspaceId)}/folders/${encodeURIComponent(node.id)}/bots/new`}
          className="shrink-0 text-xs text-gray-500 opacity-0 group-hover:opacity-100 hover:text-gray-700 hover:underline px-1"
          title="New bot in this folder"
        >
          New bot
        </Link>
        <button
          type="button"
          onClick={() => onAddChild(node.id)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-200/80 hover:text-gray-600"
          aria-label="New subfolder"
        >
          +
        </button>
      </div>
      {isCreatingHere && createForm && (
        <div className="pl-5" style={{ paddingLeft: depth * 12 + 20 }}>
          <CreateFolderForm
            name={createForm.name}
            error={createForm.error}
            submitting={createForm.submitting}
            onNameChange={(name) =>
              onFormChange(createForm ? { ...createForm, name, error: "" } : null)
            }
            onSubmit={onSubmitCreate}
            onCancel={onCancelCreate}
          />
        </div>
      )}
      {isExpanded && (
        <div className="list-none" style={{ paddingLeft: depth * 12 + 20 }}>
          {loadingBots ? (
            <span className="text-xs text-gray-400 py-0.5 block">Loading bots…</span>
          ) : Array.isArray(botsInFolder) && botsInFolder.length > 0 ? (
            <ul className="list-none pl-0 mt-0 space-y-0">
              {botsInFolder.map((bot) => (
                <li key={bot.id} className="py-0.5">
                  <Link
                    href={`/workspaces/${encodeURIComponent(workspaceId)}/bot/${encodeURIComponent(bot.id)}`}
                    className={`block truncate text-sm py-0.5 px-1 rounded ${
                      selectedBotId === bot.id
                        ? "bg-gray-200 font-medium text-gray-900"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {bot.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
      {hasChildren && isExpanded && (
        <ul className="list-none pl-0 mt-0">
          {node.children.map((child) => (
            <FolderRow
              key={child.id}
              node={child}
              depth={depth + 1}
              workspaceId={workspaceId}
              expanded={expanded}
              botsByFolderId={botsByFolderId}
              loadingBotsFor={loadingBotsFor}
              selectedBotId={selectedBotId}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onLoadBots={onLoadBots}
              createForm={createForm}
              onFormChange={onFormChange}
              onSubmitCreate={onSubmitCreate}
              onCancelCreate={onCancelCreate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
