# Project Rules — Next.js, Prisma & PostgreSQL

Guidelines for building a maintainable, scalable application. Treat this as the source of truth for structure, naming, and boundaries between layers.

---

## 1. Tech stack assumptions

- **Framework:** Next.js (App Router).
- **Database:** PostgreSQL.
- **ORM:** Prisma.
- **Language:** TypeScript everywhere (app code, scripts, tests).

---

## 2. High-level folder structure

Use a **feature-first (module) layout** inside `src/`, with **shared infrastructure** in dedicated root-level folders under `src/`.

```
src/
├── app/                          # Next.js routes, layouts, loading, error (thin)
├── modules/                      # Feature modules (primary place for domain logic)
│   ├── auth/
│   ├── users/
│   └── ...                       # One folder per bounded feature
├── components/                   # Shared UI only (used by 2+ modules)
├── constants/                    # App-wide constants (see §4)
├── context/                      # React context providers (see §5)
├── lib/                          # App wiring: prisma client, env, logger singletons
├── services/                     # Cross-cutting or orchestration (see §6)
├── utils/                        # Pure helpers, no I/O (see §7)
├── types/                        # Shared TS types / DTOs used across modules
├── hooks/                        # Shared React hooks (not feature-specific)
└── styles/                       # Global CSS, tokens (if not using CSS-in-JS only)

prisma/
├── schema.prisma
├── migrations/
└── seed.ts                       # Optional; keep seeds idempotent

public/                           # Static assets only
```

**Rule:** Feature-specific UI, hooks, and server-only code for that feature live under `src/modules/<feature>/`. Promote to `components/`, `hooks/`, or `services/` only when reused by multiple modules.

---

## 3. Module (feature) internal structure

Each module is self-contained and exposes a **narrow public API** via `index.ts` (barrel) where it helps imports stay clean.

```
src/modules/users/
├── components/                   # Feature-only UI
├── hooks/
├── actions/                      # Server Actions (if used)
├── api/                          # Route handlers co-located by feature (optional pattern)
├── server/                       # Server-only: queries, mutations, validation entry
│   ├── user.service.ts           # Uses Prisma via lib/prisma
│   └── user.validators.ts
├── types/
├── constants.ts                  # Module-scoped constants (or constants/ subfolder)
└── index.ts                      # Re-export only what other modules may import
```

**Rules:**

- **No circular imports** between modules. If two modules need each other, extract shared logic to `services/`, `utils/`, or a third small module.
- **Server vs client:** Files that use Prisma, secrets, or Node-only APIs must live under `server/`, `actions/`, or `app/` route segments — never in files marked `"use client"`.
- **Colocation:** Keep tests next to the file they test (`*.test.ts`, `*.spec.ts`) or under `__tests__/` inside the same folder.

---

## 4. `constants/` folder

**Purpose:** Single source of truth for magic strings, limits, URLs, and enums that are **not** business rules owned by one module.

**Rules:**

- Prefer `as const` objects or `enum` (team choice — stay consistent).
- No imports from `modules/`, `components/`, or Prisma — constants must stay dependency-free or depend only on other constants.
- Environment-specific values belong in **env** (see §12), not hardcoded in constants, except for safe defaults documented in comments.

Example split:

- `constants/routes.ts` — path segments, query param names.
- `constants/http.ts` — status codes used in app code (not duplicating HTTP spec).
- `constants/pagination.ts` — default page sizes.

Module-specific constants stay in the module (`modules/users/constants.ts`).

---

## 5. `context/` folder

**Purpose:** React Context providers that are **shared** across routes or modules.

**Rules:**

- One provider per file (or one folder per provider with `Provider.tsx` + `useX.ts`).
- Export a **custom hook** (`useTheme`, `useSession`) from the same module; do not export raw `Context` unless needed for testing.
- Default values should fail safely in development (e.g. throw in hook if used outside provider).
- Keep provider **thin**: compose data from hooks or server-fetched props; heavy logic belongs in `services/` or module `server/`.

---

## 6. `services/` folder

**Purpose:** Orchestration and integrations that **span features** or wrap third-party APIs (email, payments, storage, analytics).

**Rules:**

- Services may call Prisma through `lib/prisma` when the operation is inherently cross-cutting (e.g. audit log). Prefer **module `server/`** for domain CRUD.
- Services are **framework-agnostic** where possible: no `NextRequest` inside core service functions — pass plain objects/IDs.
- One external system per file or subfolder (`services/email/`, `services/storage/`).
- All I/O errors mapped to typed results or domain errors consumed by route handlers / Server Actions.

---

## 7. `utils/` folder

**Purpose:** **Pure, deterministic** helpers: formatting, small algorithms, type guards.

**Rules:**

- No database, no `fetch`, no filesystem — if I/O is needed, it is not a util; put it in `services/` or `lib/`.
- No React imports in generic utils (React-specific helpers go in `hooks/` or `components/`).
- Unit test utils heavily; they are the cheapest place for 100% coverage.

---

## 8. `lib/` and Prisma

**Prisma lives only under `prisma/`** (schema, migrations). **Application access** is centralized:

```
src/lib/
├── prisma.ts                     # singleton PrismaClient (dev hot-reload safe)
├── env.ts                        # validated environment variables
└── logger.ts                     # optional structured logging
```

**Rules:**

- **Single Prisma client instance** — import from `@/lib/prisma` (or your alias) everywhere.
- **Never** instantiate `new PrismaClient()` inside modules randomly.
- Use **transactions** for multi-step writes that must succeed or roll back together.
- **Migrations:** always created via Prisma CLI; never hand-edit applied migration history on shared databases.
- **Sensitive fields:** exclude secrets at the Prisma layer or DTO mapping layer before sending to the client.
- Prefer **`select` / `include` explicitly** in queries to avoid over-fetching and accidental PII leaks.

---

## 9. Next.js `app/` directory rules

- **Route groups** `(marketing)`, `(dashboard)` for layout organization without affecting URLs.
- **`layout.tsx`:** data fetching only when necessary; prefer passing server data to client children as props.
- **`page.tsx`:** keep thin — call module `server` functions or `services/`, map to UI.
- **`loading.tsx` / `error.tsx`:** use for UX consistency per segment.
- **API routes and Route Handlers:** validate input (e.g. Zod), return consistent JSON shapes, correct HTTP codes.
- **Server Actions:** colocate with feature under `modules/<feature>/actions/`; validate on server; revalidate tags/paths deliberately.

---

## 10. Data and validation

- **Validate at boundaries:** HTTP body, search params, Server Action arguments, webhooks.
- **Zod (or similar)** for runtime schemas; derive TypeScript types with `z.infer` where practical.
- **Prisma schema** is the database truth; **Zod** is the API/input truth — generate or align types to avoid drift (consider codegen patterns if the team agrees).

---

## 11. Naming conventions

- **Files:** `kebab-case` for routes and generic files; use consistent suffixes: `.service.ts`, `.types.ts`, `use-thing.ts` for hooks.
- **Components:** `PascalCase.tsx`.
- **Functions / variables:** `camelCase`.
- **Types / interfaces:** `PascalCase` (prefix interfaces with `I` only if the team already standardized that).
- **DB:** `snake_case` columns in PostgreSQL mapped explicitly in Prisma if the team prefers `camelCase` in TS.

---

## 12. Environment and configuration

- **Never commit** `.env` or secrets. Commit `.env.example` with dummy values and comments.
- **Validate `process.env` at startup** via `lib/env.ts` (fail fast on missing vars).
- **NODE_ENV-aware behavior** only for logging and diagnostics — not for security switches.

---

## 13. Security

- **AuthZ on the server** for every mutation and sensitive read — UI hiding alone is not security.
- **CSRF:** follow Next.js defaults for Server Actions; for cookie-based APIs, use appropriate protections.
- **SQL:** Prisma parameterizes queries — avoid raw SQL unless necessary; if used, use bound parameters only.
- **Headers:** set security headers (CSP, HSTS, etc.) at the edge or in `next.config` as appropriate.

---

## 14. Performance

- Use **`next/image`** for images; lazy-load heavy client components.
- **Caching:** use `fetch` cache options, `unstable_cache`, or tag-based revalidation intentionally — document cache lifetimes.
- **DB:** add indexes for real query patterns; use `explain` when optimizing.
- Avoid **N+1** queries; use `include`/`select` or batch queries.

---

## 15. Testing and quality

- **Lint and format:** ESLint + Prettier; run in CI.
- **Typecheck:** `tsc --noEmit` in CI.
- **Tests:** unit tests for utils and services; integration tests for critical Prisma paths (test DB or dockerized Postgres).
- **E2E (optional):** Playwright for critical user flows.

---

## 16. Git and collaboration

- **Branching:** short-lived branches; PRs required for `main`.
- **Commits:** imperative message, scoped optional (`feat(users): add invite flow`).
- **PR description:** what changed, how to test, migration notes if Prisma changed.

---

## 17. Documentation

- **README:** how to run locally, env vars, `prisma migrate`, seed, and test commands.
- **ADRs (optional):** short markdown files for big architectural decisions (`docs/adr/`).

---

## 18. Dependency direction (summary)

```
app/  →  modules/*/server | services  →  lib/prisma
modules/*/components  →  components/, utils/, constants/
context/  →  hooks/, services/ (not the reverse for heavy logic)
utils/  →  (nothing from app or modules)
constants/  →  (nothing from app or modules)
```

Violating this direction usually causes circular dependencies and harder testing.

---

## Quick checklist for new features

1. Create `src/modules/<feature>/` with `server/`, `components/`, `types/` as needed.
2. Add Prisma models/migrations in `prisma/` if persistence changes.
3. Expose minimal exports from `modules/<feature>/index.ts`.
4. Add Zod schemas at API/Server Action boundaries.
5. Wire routes in `app/` only — no business logic in `page.tsx` beyond composition.

---

*Extend this file with team-specific decisions (state library, UI kit, auth provider) once chosen, so onboarding stays one document away.*
