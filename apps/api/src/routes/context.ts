import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const contextSelect = {
  id: true,
  workspaceId: true,
  folderId: true,
  title: true,
  summary: true,
  sourceBotId: true,
  sourceFolderPath: true,
  createdAt: true,
} as const;

/**
 * GET /workspaces/:workspaceId/folders/:folderId/context
 * Returns context visible to the folder (this folder + all ancestors).
 * Requires workspace ownership; folder must exist and belong to workspace.
 */
export const contextRouter = Router();

function sendServerError(res: Response, err: unknown): void {
  console.error("[context]", err);
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
}

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

contextRouter.get("/", async (req, res) => {
  try {
    const workspace = await ensureWorkspaceOwner(req, res);
    if (!workspace) return;

    const workspaceId = workspace.id;
    const folderId = req.params.folderId;
    if (!folderId || typeof folderId !== "string") {
      res.status(400).json({ error: "folderId is required" });
      return;
    }

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, workspaceId },
      select: { id: true, parentId: true },
    });
    if (!folder) {
      res.status(404).json({ error: "Folder not found" });
      return;
    }

    const allowedFolderIds: string[] = [folder.id];
    let currentId: string | null = folder.parentId;
    while (currentId) {
      allowedFolderIds.push(currentId);
      const parent = await prisma.folder.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      currentId = parent?.parentId ?? null;
    }

    const contexts = await prisma.context.findMany({
      where: { workspaceId, folderId: { in: allowedFolderIds } },
      orderBy: { createdAt: "desc" },
      select: contextSelect,
    });

    res.json(contexts);
  } catch (err) {
    sendServerError(res, err);
  }
});
