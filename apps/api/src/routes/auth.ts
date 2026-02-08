import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";

export const authRouter = Router();

/**
 * POST /auth/signup — create user with email + password (for Credentials provider).
 * Body: { email, password, name? }
 */
authRouter.post("/signup", async (req, res) => {
  const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "email and password required" });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    res.status(409).json({ error: "User already exists with this email" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      name: name?.trim() || null,
      passwordHash,
    },
  });
  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
  });
});

/**
 * POST /auth/credentials — validate email+password for NextAuth Credentials provider.
 * Body: { email, password }
 * Returns user or 401.
 */
authRouter.post("/credentials", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "email and password required" });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user?.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
  });
});

/**
 * POST /auth/oauth-user — get or create user by email (for NextAuth OAuth callbacks).
 * Body: { email, name? }
 * Called by Next.js server when Google/GitHub sign-in returns profile; no auth required.
 */
authRouter.post("/oauth-user", async (req, res) => {
  const { email, name } = req.body as { email?: string; name?: string };
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "email required" });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: normalizedEmail, name: name?.trim() || null },
    });
  }
  res.json({ id: user.id, email: user.email, name: user.name });
});
