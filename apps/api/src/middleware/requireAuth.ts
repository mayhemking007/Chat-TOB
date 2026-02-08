import type { Request, Response, NextFunction } from "express";
import { verifyNextAuthToken } from "../lib/auth.js";

/**
 * Reads Bearer token from Authorization header (or from cookie if you add it).
 * Verifies NextAuth JWT and sets req.user. Sends 401 if missing or invalid.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const payload = token ? verifyNextAuthToken(token) : null;
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.user = {
    id: payload.sub,
    email: payload.email ?? "",
    name: payload.name ?? null,
  };
  next();
}

/**
 * Optional auth: sets req.user if valid token present, does not 401 if missing.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const payload = token ? verifyNextAuthToken(token) : null;
  if (payload) {
    req.user = {
      id: payload.sub,
      email: payload.email ?? "",
      name: payload.name ?? null,
    };
  }
  next();
}
