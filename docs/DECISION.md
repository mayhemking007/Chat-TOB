# DECISION.md

Log of files created, updated, and descriptions of changes with date and time.  
**Update this after every checkpoint** (see [roadmap.md](roadmap.md)).

---

## Format

Each entry includes:
- **Date & time** (UTC or local, be consistent)
- **Checkpoint** (optional; e.g. "Phase 1 – 1.4")
- **Change type:** Created | Updated
- **Files** (path and brief description)
- **Summary** (what changed and why)

---

## Log

### 2025-02-06 — DECISION log created

| Type   | File(s) | Description |
|--------|---------|-------------|
| Created | `docs/DECISION.md` | Initial decision log; defines format and purpose. |

**Summary:** Added DECISION.md to record file creation/update logs with date, checkpoint, and description. To be updated after every roadmap checkpoint.

---

### 2025-02-06 — Phase 1.1: Monorepo scaffold

| Type   | File(s) | Description |
|--------|---------|-------------|
| Created | `package.json` | Root package.json with npm workspaces (`apps/*`, `packages/*`). |
| Created | `.gitignore` | Ignore node_modules, .next, dist, .env, etc. |
| Created | `apps/web/` | Next.js app (App Router, TypeScript, Tailwind). |
| Created | `apps/api/` | Express API (TypeScript, health route). |
| Created | `packages/types/` | Shared TypeScript types package (placeholder). |

**Summary:** Scaffolded monorepo per roadmap Phase 1.1: Next.js frontend in `apps/web`, Express backend in `apps/api`, shared types in `packages/types`. Root scripts: `dev:web`, `dev:api`, `build:web`, `build:api`. Web uses Tailwind and App Router per ARCHITECTURE; API has minimal Express server with `/health`.

---

### 2025-02-07 — Phase 1.2: Prisma + PostgreSQL working

| Type   | File(s) | Description |
|--------|---------|-------------|
| Created | `apps/api/prisma/schema.prisma` | User and Workspace models; datasource (url in config per Prisma 7). |
| Created | `apps/api/prisma.config.ts` | Prisma 7 config: schema path, migrations path, datasource URL (from env). |
| Created | `apps/api/src/lib/prisma.ts` | Singleton PrismaClient with @prisma/adapter-pg (Neon/direct Postgres). |
| Created | `apps/api/src/generated/prisma/` | Generated client stub (client.d.ts, client.js); replaced by `prisma generate` output. |
| Updated | `apps/api/package.json` | Added prisma, @prisma/client, @prisma/adapter-pg, pg, dotenv; scripts db:generate, db:migrate. |
| Updated | `apps/api/src/index.ts` | Health route reports db status (unconfigured / connected / disconnected); dotenv/config. |
| Updated | `package.json` (root) | Scripts db:generate, db:migrate delegating to apps/api. |

**Summary:** Phase 1.2 complete. PostgreSQL + Prisma set up in `apps/api`: User and Workspace models, connection via Prisma 7 config and pg adapter, migrations run against Neon. Run `npm run db:generate` and set `DATABASE_URL` in `apps/api/.env`; then `npm run db:migrate` and `npm run dev:api`. Prisma is working.

---

*(Add new entries below, most recent first.)*
