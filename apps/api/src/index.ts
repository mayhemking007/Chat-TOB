import "dotenv/config";
import express from "express";
import { prisma } from "./lib/prisma.js";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(express.json());

app.get("/health", async (_req, res) => {
  const db =
    process.env.DATABASE_URL?.trim() === ""
      ? "unconfigured"
      : await prisma.$connect().then(() => "connected").catch(() => "disconnected");
  res.json({ status: "ok", db });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
