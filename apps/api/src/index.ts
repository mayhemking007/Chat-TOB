import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import { authRouter } from "./routes/auth.js";
import { folderBotsRouter, workspaceBotsRouter } from "./routes/bots.js";
import { contextRouter } from "./routes/context.js";
import { foldersRouter } from "./routes/folders.js";
import { usersRouter } from "./routes/users.js";
import { workspacesRouter } from "./routes/workspaces.js";
import { requireAuth } from "./middleware/requireAuth.js";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", async (_req, res) => {
  const db =
    process.env.DATABASE_URL?.trim() === ""
      ? "unconfigured"
      : await prisma.$connect().then(() => "connected").catch(() => "disconnected");
  res.json({ status: "ok", db });
});

app.use("/auth", authRouter);

app.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        lastActiveWorkspaceId: true,
        createdAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error("[auth/me]", err);
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/users", requireAuth, usersRouter);
app.use("/workspaces/:workspaceId/folders/:folderId/context", requireAuth, contextRouter);
app.use("/workspaces/:workspaceId/folders/:folderId/bots", requireAuth, folderBotsRouter);
app.use("/workspaces/:workspaceId/folders", requireAuth, foldersRouter);
app.use("/workspaces/:workspaceId/bots", requireAuth, workspaceBotsRouter);
app.use("/workspaces", requireAuth, workspacesRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[API error]", err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
