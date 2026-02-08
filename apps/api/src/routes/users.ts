import type { Response } from "express";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const usersRouter = Router();

function sendServerError(res: Response, err: unknown): void {
  console.error("[users]", err);
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
}

/**
 * PATCH /users/me — update current user (e.g. lastActiveWorkspaceId).
 * Body: { lastActiveWorkspaceId: string | null }
 */
usersRouter.patch("/me", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { lastActiveWorkspaceId } = req.body as { lastActiveWorkspaceId?: string | null };

    if (lastActiveWorkspaceId === undefined) {
      res.status(400).json({ error: "lastActiveWorkspaceId is required (may be null)" });
      return;
    }

    if (lastActiveWorkspaceId !== null && typeof lastActiveWorkspaceId !== "string") {
      res.status(400).json({ error: "lastActiveWorkspaceId must be a string or null" });
      return;
    }

    if (lastActiveWorkspaceId != null && lastActiveWorkspaceId.trim() === "") {
      res.status(400).json({ error: "lastActiveWorkspaceId cannot be empty string" });
      return;
    }

    const value = lastActiveWorkspaceId === null ? null : lastActiveWorkspaceId.trim();

    if (value !== null) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: value },
        select: { id: true, ownerId: true },
      });
      if (!workspace) {
        res.status(404).json({ error: "Workspace not found" });
        return;
      }
      if (workspace.ownerId !== userId) {
        res.status(403).json({ error: "Forbidden: not the workspace owner" });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { lastActiveWorkspaceId: value },
      select: {
        id: true,
        email: true,
        name: true,
        lastActiveWorkspaceId: true,
        createdAt: true,
      },
    });
    res.json(user);
  } catch (err) {
    sendServerError(res, err);
  }
});
