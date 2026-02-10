import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

// mergeParams: true so req.params.workspaceId is available when mounted at /workspaces/:workspaceId/folders
export const foldersRouter = Router({ mergeParams: true });

const folderSelect = {
  id: true,
  workspaceId: true,
  parentId: true,
  name: true,
  sortOrder: true,
  createdAt: true,
} as const;

type FolderFlat = {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  createdAt: Date;
};

type FolderTree = FolderFlat & { children: FolderTree[] };

function sendServerError(res: Response, err: unknown): void {
  console.error("[folders]", err);
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
}

/**
 * Load workspace by workspaceId (from params); verify current user is owner.
 * Sends 404 or 403 and returns null if not allowed; returns workspace otherwise.
 */
async function ensureWorkspaceOwner(req: Request, res: Response): Promise<{ id: string } | null> {
  const workspaceId = req.params.workspaceId;
  const userId = req.user!.id;
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, ownerId: true },
  });
  if (!workspace) {
    res.status(404).json({ error: "Workspace not found" });
    return null;
  }
  if (workspace.ownerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return { id: workspace.id };
}

function buildTree(folders: FolderFlat[]): FolderTree[] {
  const byParent = new Map<string | null, FolderFlat[]>();
  for (const f of folders) {
    const key = f.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(f);
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());
  }
  function build(parentKey: string | null): FolderTree[] {
    const list = byParent.get(parentKey) ?? [];
    return list.map((f) => ({
      ...f,
      children: build(f.id),
    }));
  }
  return build(null);
}

/**
 * GET /workspaces/:workspaceId/folders
 * Query: parentId (optional) — direct children of this folder; else roots.
 *        tree=1 — full tree (nested children).
 */
foldersRouter.get("/", async (req, res) => {
  try {
    const workspace = await ensureWorkspaceOwner(req, res);
    if (!workspace) return;

    const workspaceId = workspace.id;
    const tree = req.query.tree === "1" || req.query.tree === "true";
    const parentIdParam = req.query.parentId;
    const parentId = typeof parentIdParam === "string" && parentIdParam.trim() ? parentIdParam.trim() : null;

    if (tree) {
      const all = await prisma.folder.findMany({
        where: { workspaceId },
        select: folderSelect,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      const treeData = buildTree(all as FolderFlat[]);
      res.json(treeData);
      return;
    }

    if (parentId) {
      const parent = await prisma.folder.findFirst({
        where: { id: parentId, workspaceId },
        select: { id: true },
      });
      if (!parent) {
        res.status(404).json({ error: "Folder not found" });
        return;
      }
      const children = await prisma.folder.findMany({
        where: { parentId },
        select: folderSelect,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      res.json(children);
      return;
    }

    const roots = await prisma.folder.findMany({
      where: { workspaceId, parentId: null },
      select: folderSelect,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    res.json(roots);
  } catch (err) {
    sendServerError(res, err);
  }
});

/**
 * POST /workspaces/:workspaceId/folders
 * Body: { name: string, parentId?: string | null }
 */
foldersRouter.post("/", async (req, res) => {
  try {
    const workspace = await ensureWorkspaceOwner(req, res);
    if (!workspace) return;

    const workspaceId = workspace.id;
    const body = req.body as { name?: unknown; parentId?: string | null } | undefined;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Request body must be a JSON object" });
      return;
    }
    const { name, parentId: bodyParentId } = body;

    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "name is required and must be non-empty" });
      return;
    }

    const trimmedName = name.trim();
    const parentId = bodyParentId != null && typeof bodyParentId === "string" && bodyParentId.trim()
      ? bodyParentId.trim()
      : null;

    if (parentId) {
      const parent = await prisma.folder.findFirst({
        where: { id: parentId, workspaceId },
        select: { id: true },
      });
      if (!parent) {
        res.status(404).json({ error: "Parent folder not found" });
        return;
      }
    }

    const existingSibling = await prisma.folder.findFirst({
      where: { workspaceId, parentId, name: trimmedName },
      select: { id: true },
    });
    if (existingSibling) {
      res.status(409).json({ error: "A folder with this name already exists in this location." });
      return;
    }

    const maxOrder = await prisma.folder.aggregate({
      where: { workspaceId, parentId },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const folder = await prisma.folder.create({
      data: {
        workspaceId,
        parentId,
        name: trimmedName,
        sortOrder,
      },
      select: folderSelect,
    });

    res.status(201).json(folder);
  } catch (err) {
    console.error("[folders] POST error:", err);
    if (err instanceof Error) console.error("[folders] stack:", err.stack);
    sendServerError(res, err);
  }
});
