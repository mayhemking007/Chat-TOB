/**
 * Stub types for Prisma Client until you run: npx prisma generate
 * (from apps/api with DATABASE_URL set). Prisma generate overwrites this folder.
 */
export declare class PrismaClient {
  constructor(options?: { adapter?: unknown; log?: string[] });
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  readonly user: unknown;
  readonly workspace: unknown;
  [model: string]: unknown;
}
