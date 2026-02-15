import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { complete } from "../lib/llm.js";

type Params = { workspaceId?: string; botId?: string };

const messageSelect = {
  id: true,
  botId: true,
  role: true,
  content: true,
  createdAt: true,
} as const;

function sendServerError(res: Response, err: unknown): void {
  console.error("[messages]", err);
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

/** Ensure bot exists and belongs to the given workspace. Returns bot id or null and sends error. */
async function ensureBotInWorkspace(
  req: Request,
  res: Response,
  workspaceId: string
): Promise<{ id: string } | null> {
  const botId = (req.params as Params).botId;
  if (!botId || typeof botId !== "string") {
    res.status(400).json({ error: "botId is required" });
    return null;
  }
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    select: { id: true, folder: { select: { workspaceId: true } } },
  });
  if (!bot || bot.folder.workspaceId !== workspaceId) {
    res.status(404).json({ error: "Bot not found" });
    return null;
  }
  return { id: bot.id };
}

// Mount at /workspaces/:workspaceId/bots/:botId/messages
export const messagesRouter = Router();

messagesRouter.get("/", async (req, res) => {
  try {
    const workspace = await ensureWorkspaceOwner(req, res);
    if (!workspace) return;
    const bot = await ensureBotInWorkspace(req, res, workspace.id);
    if (!bot) return;

    const messages = await prisma.message.findMany({
      where: { botId: bot.id },
      orderBy: { createdAt: "asc" },
      select: messageSelect,
    });
    res.json(messages);
  } catch (err) {
    sendServerError(res, err);
  }
});

messagesRouter.post("/", async (req, res) => {
  try {
    const workspace = await ensureWorkspaceOwner(req, res);
    if (!workspace) return;
    const bot = await ensureBotInWorkspace(req, res, workspace.id);
    if (!bot) return;

    const body = req.body as { content?: unknown } | undefined;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Request body must be a JSON object" });
      return;
    }
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      res.status(400).json({ error: "content is required and must be non-empty" });
      return;
    }

    const userMessage = await prisma.message.create({
      data: { botId: bot.id, role: "user", content },
      select: messageSelect,
    });

    const messagesForLlm = [{ role: "user" as const, content }];
    const assistantText = await complete(messagesForLlm);

    const assistantMessage = await prisma.message.create({
      data: { botId: bot.id, role: "assistant", content: assistantText },
      select: messageSelect,
    });

    res.status(201).json({
      userMessage,
      assistantMessage,
    });
  } catch (err) {
    sendServerError(res, err);
  }
});
