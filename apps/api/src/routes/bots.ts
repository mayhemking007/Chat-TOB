import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

type Params = { workspaceId?: string; folderId?: string; botId?: string };

const botSelect = {
  id: true,
  folderId: true,
  name: true,
  description: true,
  purpose: true,
  type: true,
  createdAt: true,
} as const;

function sendServerError(res: Response, err: unknown): void {
  console.error("[bots]", err);
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
}

async function ensureWorkspaceOwner(req: Request, res: Response): Promise<{ id: string } | null> {
  const workspaceId = (req.params as Params).workspaceId;
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

/** Compute folder id + all ancestor folder ids for visibility checks. */
async function getAllowedFolderIds(
  folderId: string,
  workspaceId: string
): Promise<string[] | null> {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, workspaceId },
    select: { id: true, parentId: true },
  });
  if (!folder) return null;
  const allowed: string[] = [folder.id];
  let currentId: string | null = folder.parentId;
  while (currentId) {
    allowed.push(currentId);
    const parent = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    currentId = parent?.parentId ?? null;
  }
  return allowed;
}

// Mount at /workspaces/:workspaceId/folders/:folderId/bots
export const folderBotsRouter = Router({ mergeParams: true });

folderBotsRouter.get("/", async (req, res) => {
  try {
    const workspace = await ensureWorkspaceOwner(req, res);
    if (!workspace) return;

    const folderId = (req.params as Params).folderId;
    if (!folderId || typeof folderId !== "string") {
      res.status(400).json({ error: "folderId is required" });
      return;
    }

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, workspaceId: workspace.id },
      select: { id: true },
    });
    if (!folder) {
      res.status(404).json({ error: "Folder not found" });
      return;
    }

    const bots = await prisma.bot.findMany({
      where: { folderId },
      orderBy: { createdAt: "asc" },
      select: botSelect,
    });
    res.json(bots);
  } catch (err) {
    sendServerError(res, err);
  }
});

folderBotsRouter.post("/", async (req, res) => {
  try {
    const workspace = await ensureWorkspaceOwner(req, res);
    if (!workspace) return;

    const workspaceId = workspace.id;
    const folderId = (req.params as Params).folderId;
    if (!folderId || typeof folderId !== "string") {
      res.status(400).json({ error: "folderId is required" });
      return;
    }

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, workspaceId },
      select: { id: true },
    });
    if (!folder) {
      res.status(404).json({ error: "Folder not found" });
      return;
    }

    const body = req.body as {
      name?: unknown;
      description?: unknown;
      purpose?: unknown;
      type?: unknown;
      contextIds?: unknown;
    } | undefined;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Request body must be a JSON object" });
      return;
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      res.status(400).json({ error: "name is required and must be non-empty" });
      return;
    }

    const type = body.type === "fresh" || body.type === "context_aware" ? body.type : null;
    if (!type) {
      res.status(400).json({ error: "type must be 'fresh' or 'context_aware'" });
      return;
    }

    const description =
      body.description != null && typeof body.description === "string"
        ? body.description.trim() || null
        : null;
    const purpose =
      body.purpose != null && typeof body.purpose === "string"
        ? body.purpose.trim() || null
        : null;

    let contextIds: string[] = [];
    if (body.contextIds != null) {
      if (!Array.isArray(body.contextIds)) {
        res.status(400).json({ error: "contextIds must be an array" });
        return;
      }
      contextIds = [...new Set(body.contextIds.filter((id): id is string => typeof id === "string" && id.length > 0))];
    }

    if (type === "fresh" && contextIds.length > 0) {
      res.status(400).json({ error: "contextIds must be empty when type is 'fresh'" });
      return;
    }

    if (type === "context_aware" && contextIds.length > 0) {
      const allowedFolderIds = await getAllowedFolderIds(folderId, workspaceId);
      if (!allowedFolderIds) {
        res.status(404).json({ error: "Folder not found" });
        return;
      }
      const validContexts = await prisma.context.findMany({
        where: {
          id: { in: contextIds },
          workspaceId,
          folderId: { in: allowedFolderIds },
        },
        select: { id: true },
      });
      if (validContexts.length !== contextIds.length) {
        res.status(400).json({
          error: "One or more context IDs are invalid or not visible in this folder",
        });
        return;
      }
    }

    const bot = await prisma.bot.create({
      data: {
        folderId,
        name,
        description,
        purpose,
        type,
      },
      select: botSelect,
    });

    if (type === "context_aware" && contextIds.length > 0) {
      await prisma.botContext.createMany({
        data: contextIds.map((contextId) => ({ botId: bot.id, contextId })),
      });
    }

    res.status(201).json({
      ...bot,
      selectedContextIds: type === "context_aware" ? contextIds : [],
    });
  } catch (err) {
    sendServerError(res, err);
  }
});

// Mount at /workspaces/:workspaceId/bots
export const workspaceBotsRouter = Router({ mergeParams: true });

workspaceBotsRouter.get("/:botId", async (req, res) => {
  try {
    const workspace = await ensureWorkspaceOwner(req, res);
    if (!workspace) return;

    const botId = (req.params as Params).botId;
    if (!botId || typeof botId !== "string") {
      res.status(400).json({ error: "botId is required" });
      return;
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: {
        ...botSelect,
        folder: { select: { workspaceId: true } },
      },
    });
    if (!bot || bot.folder.workspaceId !== workspace.id) {
      res.status(404).json({ error: "Bot not found" });
      return;
    }

    const selections = await prisma.botContext.findMany({
      where: { botId },
      select: { contextId: true },
    });
    const selectedContextIds = selections.map((s) => s.contextId);

    const { folder: _folder, ...botFields } = bot;
    res.json({
      ...botFields,
      selectedContextIds,
    });
  } catch (err) {
    sendServerError(res, err);
  }
});
