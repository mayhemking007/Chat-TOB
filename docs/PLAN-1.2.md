# Plan: Phase 1.2 — PostgreSQL + Prisma (User, Workspace)

**Goal (from roadmap):** PostgreSQL + Prisma: `User`, `Workspace`; user–workspace relation (e.g. "user owns workspaces").

**Outcome:** Database and ORM set up in the API app with `User` and `Workspace` models and correct ownership relation. No auth yet (that’s 1.3).

---

## 1. Scope

| In scope | Out of scope |
|----------|----------------|
| Add PostgreSQL + Prisma to `apps/api` | Auth, sign-up, login (1.3) |
| `User` model (id, email, name, created_at) | Workspace API routes (1.4) |
| `Workspace` model (id, name, owner_id, created_at) | UI for workspaces (1.5) |
| One-to-many: User → Workspaces (owner) | Folders, bots, context, messages |

---

## 2. Tasks

### 2.1 Add PostgreSQL and Prisma to API

- [ ] **2.1.1** Install in `apps/api`: `prisma` (dev), `@prisma/client` (runtime).
- [ ] **2.1.2** Run `npx prisma init` in `apps/api` (creates `prisma/schema.prisma` and `.env`).
- [ ] **2.1.3** Configure `schema.prisma`:
  - `provider = "postgresql"`
  - `url = env("DATABASE_URL")`
- [ ] **2.1.4** Add `DATABASE_URL` to `apps/api/.env` (and `.env.example`). Use placeholder for local Postgres, e.g. `postgresql://user:password@localhost:5432/chat_tob`.
- [ ] **2.1.5** Add `apps/api/.env` to `.gitignore` if not already; keep `.env.example` committed.

### 2.2 Define User and Workspace in Prisma

- [ ] **2.2.1** Add **User** model per [DATA_MODELS.md](DATA_MODELS.md) §3.1:
  - `id` (String, `@id`, `@default(cuid())` or `uuid()`)
  - `email` (String, unique)
  - `name` (String, optional if desired)
  - `createdAt` (DateTime, `@default(now())`)
  - Relation: `workspaces Workspace[]`
- [ ] **2.2.2** Add **Workspace** model per DATA_MODELS §3.2:
  - `id` (String, `@id`, `@default(cuid())` or `uuid()`)
  - `name` (String)
  - `ownerId` (String, FK to User)
  - `createdAt` (DateTime, `@default(now())`)
  - Relation: `owner User @relation(fields: [ownerId], references: [id], onDelete: Cascade)`
- [ ] **2.2.3** On User: `workspaces Workspace[]` so one user has many workspaces.
- [ ] **2.2.4** Run `npx prisma generate` and fix any schema errors.

### 2.3 Database Creation and Migration

- [ ] **2.3.1** Ensure PostgreSQL is available (local or Neon; ARCHITECTURE mentions Neon).
- [ ] **2.3.2** Run first migration from `apps/api`: `npx prisma migrate dev --name init_user_workspace`.
- [ ] **2.3.3** Verify tables `User` and `Workspace` (and correct FK) in DB.

### 2.4 Wire Prisma Client into API

- [ ] **2.4.1** Create a single Prisma client instance (e.g. `src/lib/prisma.ts` or `src/db.ts`) so the app doesn’t create multiple connections.
- [ ] **2.4.2** Use that client in `apps/api/src/index.ts` (e.g. health check or a trivial read) to confirm DB connectivity.
- [ ] **2.4.3** Optionally add a root script in the monorepo to run migrations from API, e.g. `npm run db:migrate` → `prisma migrate dev -w apps/api` (or `deploy` for CI).

### 2.5 Shared Types (optional for 1.2)

- [ ] **2.5.1** If `packages/types` should expose User/Workspace shapes for the frontend, add minimal types (id, email, name for User; id, name, ownerId for Workspace) and keep Prisma as the source of truth in the API. This can be done in 1.4 when workspace API is added.

---

## 3. Verification

- [ ] From project root, `npm run dev:api` starts without errors.
- [ ] From `apps/api`, `npx prisma migrate dev` runs cleanly and DB has `User` and `Workspace` with correct relation.
- [ ] Prisma Client is used at least once in the API (e.g. health or readiness check) and responds when DB is up.

---

## 4. Files to Create or Touch

| Path | Action |
|------|--------|
| `apps/api/prisma/schema.prisma` | Create (init) then edit with User, Workspace |
| `apps/api/.env` | Create with `DATABASE_URL` |
| `apps/api/.env.example` | Create with `DATABASE_URL=` placeholder |
| `apps/api/src/lib/prisma.ts` (or `src/db.ts`) | Create singleton Prisma client |
| `apps/api/src/index.ts` | Use Prisma for health/readiness or simple query |
| `apps/api/package.json` | Add prisma, @prisma/client; optional script `db:migrate` |
| `.gitignore` | Ensure `apps/api/.env` ignored |
| `package.json` (root) | Optional: `"db:migrate": "npm run ... -w apps/api"` |

---

## 5. Order of Work

1. Install Prisma, init, env (2.1).
2. Define User and Workspace in schema (2.2).
3. Generate client and run first migration (2.3).
4. Singleton client + use in API (2.4).
5. Verification (Section 3).
6. Optional: shared types and root script (2.5, 2.4.3).

---

## 6. Notes

- **Neon:** If using Neon, set `DATABASE_URL` to the Neon connection string; Prisma works the same. Pooling (e.g. Neon’s pooled URL) is recommended for serverless if you move there later.
- **Cascade:** `onDelete: Cascade` on Workspace → User ensures deleting a user removes their workspaces; required for workspace isolation and cleanup.
- **Auth later:** No password or session fields on User in 1.2; those come in 1.3.
