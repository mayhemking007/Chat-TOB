"use client";

import { useCallback, useEffect, useState } from "react";

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
  const [tree, setTree] = useState<FolderTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [createForm, setCreateForm] = useState<CreateFormState>(null);

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
              expanded={expanded}
              onToggle={toggleExpanded}
              onAddChild={openCreateForm}
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
  expanded,
  onToggle,
  onAddChild,
  createForm,
  onFormChange,
  onSubmitCreate,
  onCancelCreate,
}: {
  node: FolderTreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string) => void;
  createForm: CreateFormState;
  onFormChange: (f: CreateFormState) => void;
  onSubmitCreate: () => void;
  onCancelCreate: () => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isCreatingHere = createForm?.parentId === node.id;

  return (
    <li className="list-none">
      <div
        className="flex items-center gap-0.5 py-0.5 group"
        style={{ paddingLeft: depth * 12 }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node.id)}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-200/80"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {hasChildren ? (
            <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
          ) : (
            <span className="w-2" />
          )}
        </button>
        <span className="min-w-0 flex-1 truncate text-sm text-gray-800">
          {node.name}
        </span>
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
      {hasChildren && isExpanded && (
        <ul className="list-none pl-0 mt-0">
          {node.children.map((child) => (
            <FolderRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onAddChild={onAddChild}
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
