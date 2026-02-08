import type { Response } from "express";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const workspacesRouter = Router();

function sendServerError(res: Response, err: unknown): void {
  console.error("[workspaces]", err);
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
}

/**
 * POST /workspaces — create a workspace for the current user.
 * Body: { name: string }
 */
workspacesRouter.post("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { name } = req.body as { name?: unknown };
    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "name is required and must be non-empty" });
      return;
    }
    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        ownerId: userId,
      },
    });
    res.status(201).json({
      id: workspace.id,
      name: workspace.name,
      ownerId: workspace.ownerId,
      createdAt: workspace.createdAt,
    });
  } catch (err) {
    sendServerError(res, err);
  }
});

/**
 * GET /workspaces — list workspaces owned by the current user.
 */
workspacesRouter.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const workspaces = await prisma.workspace.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, ownerId: true, createdAt: true },
    });
    res.json(workspaces);
  } catch (err) {
    sendServerError(res, err);
  }
});

/**
 * GET /workspaces/:id — get one workspace by id (must be owner).
 */
workspacesRouter.get("/:id", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { id: true, name: true, ownerId: true, createdAt: true },
    });
    if (!workspace) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }
    if (workspace.ownerId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    res.json(workspace);
  } catch (err) {
    sendServerError(res, err);
  }
});
