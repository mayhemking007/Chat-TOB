import { verify } from "jsonwebtoken";

const secret = process.env.NEXTAUTH_SECRET ?? "";

export interface JwtPayload {
  sub: string;
  email?: string;
  name?: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Verifies the JWT issued by NextAuth (same NEXTAUTH_SECRET).
 * Returns payload with sub (user id), email, name or null if invalid.
 */
export function verifyNextAuthToken(token: string): JwtPayload | null {
  if (!secret || !token) return null;
  try {
    const payload = verify(token, secret, { algorithms: ["HS256"] }) as JwtPayload;
    return payload?.sub ? payload : null;
  } catch {
    return null;
  }
}
