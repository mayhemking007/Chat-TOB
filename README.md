# Chat TOB

Bot workspace for AI chatbots with scoped, reusable context. See [docs/VISION.md](docs/VISION.md).

## Structure (Phase 1.1)

- **apps/web** — Next.js (App Router, TypeScript, Tailwind)
- **apps/api** — Express API (TypeScript)
- **packages/types** — Shared TypeScript types

## Setup

```bash
npm install
```

## Run

- Frontend: `npm run dev:web` (Next.js at http://localhost:3000)
- API: `npm run dev:api` (Express at http://localhost:4000)

Build: `npm run build:web`, `npm run build:api`.
