# Call Intelligence Platform

Next.js (App Router) + Prisma + PostgreSQL + Tailwind + shadcn/ui — aligned with `rules.md` and `PLAN.md`.

## Prerequisites

- Node.js 20+
- PostgreSQL

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Set `DATABASE_URL` and a long random `SESSION_SECRET` (≥ 32 characters). Add `OPENAI_API_KEY` when implementing transcription/analysis.

3. Install dependencies and generate Prisma Client:

   ```bash
   npm install
   npm run db:generate
   ```

4. Create tables:

   ```bash
   npm run db:migrate
   ```

   Or for quick local prototyping: `npm run db:push`

5. Run the app:

   ```bash
   npm run dev
   ```

6. (Later) Background worker placeholder:

   ```bash
   npm run worker
   ```

## Project structure

| Path | Purpose |
|------|---------|
| `src/app/` | Routes, thin layouts |
| `src/modules/` | Feature modules (`auth`, …) |
| `src/components/` | Shared UI (`layout/`, `auth/`, `theme/`, `ui/`) |
| `src/constants/` | Routes, theme cookie name, permission helpers |
| `src/context/` | App providers (theme, toasts) |
| `src/lib/` | Prisma, env, auth session, permission checks |
| `src/services/` | `storage/local-audio`, `transcription`, `analysis` (stubs → OpenAI in worker) |
| `src/modules/calls/` | Upload flow UI, dashboard stats, calls list/detail (PLAN §4–5) |
| `src/modules/reports/` | Re-exports org-level stats (`getDashboardStats`) |
| `src/modules/files/` | Re-exports storage helpers |
| `src/utils/` | Pure helpers |
| `prisma/` | Schema & migrations |
| `worker/` | Queue worker entry (BullMQ per PLAN) |

## Call analysis flow

1. **Upload** — `/dashboard/calls/upload` → `POST /api/calls/upload` saves audio under `storage/uploads/{orgId}/…`, creates `Call` + `AnalysisJob` (`QUEUED`).
2. **Worker** — `npm run worker` picks `QUEUED` jobs, runs stub transcription + analysis, writes `Transcript` + `CallInsight`, marks job/call `COMPLETED` (replace stubs with OpenAI; add BullMQ per PLAN).
3. **Dashboard** — `/dashboard` shows six KPI widgets from `CallInsight` aggregates.
4. **Detail** — `/dashboard/calls/[id]` — player (`/api/calls/[id]/audio`), transcript, scores, questionnaire, keywords, notes (PLAN §5).

**DB:** After pulling, run `npx prisma db push` (or `migrate dev`) so `Call`, `Transcript`, `AnalysisJob`, `AnalysisBatch`, `CallInsight` tables exist.

## Auth & tenancy

- **Register company** creates an organisation, default **Admin** and **Member** roles (JSON permission matrix), and the first user as Admin.
- **Session** is stored in PostgreSQL with an **httpOnly** cookie.
- **Users** with the `users` module `r` permission see **Dashboard → Users** (Admin has full CRUD keys in JSON for future UI).

## Theme

Theme preference is stored in the **`theme`** cookie and applied on the server for first paint (`layout.tsx`) to reduce flash. Use the header theme control to switch light / dark / system.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:push` | `prisma db push` |
| `npm run worker` | Worker stub |

## Docs

- [rules.md](./rules.md) — architecture rules  
- [PLAN.md](./PLAN.md) — product & technical plan  
