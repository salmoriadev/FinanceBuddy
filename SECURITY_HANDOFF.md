# FinanceBuddy Security Handoff

Last updated: 2026-06-01

This handoff exists because there are two active sessions working around the
same repository. Use it as the coordination source before starting more security
work.

## Current Git State

Latest security-related commits on `main`:

- `65bf4a3 feat: strengthen auth and financial validation`
- `071da1a feat: harden refresh token reuse handling`
- `0ad7a0b docs: add security improvement backlog`
- `6d3c4a2 docs: document security portfolio case`

At the time this handoff was written, another active session had many
uncommitted working-tree changes across API, web, and docs files. Treat the
working tree as shared and unstable until both sessions coordinate.

Previously known untracked planning files left outside the security commits:

- `GAP-ANALYSIS.md`
- `REQUIREMENTS.md`
- `RESEARCH.md`
- `ROADMAP-INVESTMENTS.md`

Those files were intentionally not included in the security commits because they
appear to be planning artifacts from another flow.

Before committing anything else, run:

```bash
git status --short
git diff --stat
```

Then stage only the files that belong to the current session.

## What Was Implemented

### Portfolio/Security Documentation

Added and updated:

- `SECURITY.md`
- `SECURITY_STATUS.md`
- `security_best_practices_report.md`
- README security and DevSecOps sections
- GitHub Actions workflows:
  - `.github/workflows/ci.yml`
  - `.github/workflows/security.yml`

Purpose:

- Make FinanceBuddy read as a fintech/AppSec portfolio project.
- Explain existing controls such as Argon2id, JWT, refresh rotation, CSRF,
  rate limiting, validation, RLS, and authorization tests.
- Track what is done and what still remains.

### S-02: Refresh Token Reuse Detection

Status: done.

Implemented behavior:

- Refresh tokens now have `family_id`.
- When a refresh token is rotated, the old token stores
  `replaced_by_token_id`.
- If a revoked refresh token is presented again, the API treats that as possible
  token theft.
- The API writes a `refresh_token_reuse` security event.
- The API revokes every active refresh token in that same token family.

Important files:

- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.repository.ts`
- `apps/api/prisma/schema.prisma`
- `apps/api/test/auth.service.spec.ts`
- `supabase/migrations/20260531123000_add_refresh_token_family.sql`
- `supabase/migrations/20260531124000_add_security_events.sql`

Why this matters:

- Before this, a reused old refresh token was only rejected.
- Now it is handled as a compromise signal with family revocation and audit
  evidence.

### S-03: Auth Table Hardening

Status: done and applied to the configured Supabase/Postgres database on
2026-06-01.

Implemented behavior:

- Enables RLS on `public.users` and `public.refresh_tokens`.
- Revokes direct access from Supabase `anon` and `authenticated`.
- Adds restrictive deny policies for those browser-facing roles.

Important file:

- `supabase/migrations/20260531120000_harden_custom_auth_tables.sql`

Operational note:

- The migration has been applied through `psql` using `apps/api/.env`.
- The app uses Prisma/API-managed auth, so frontend code should keep talking to
  the Nest API and never directly to these tables.

### S-04: Explicit CSRF Token

Status: done.

Implemented behavior:

- Added `GET /api/v1/auth/csrf`.
- The endpoint returns a CSRF token and sets a `csrf_token` cookie.
- Mutating API requests from the frontend fetch that token and send it in
  `X-CSRF-Token`.
- The backend checks:
  - `X-Requested-With: XMLHttpRequest`
  - `csrf_token` cookie equals `X-CSRF-Token`
  - production `Origin`/`Referer` matches configured `CORS_ORIGIN`
- In production, missing `CORS_ORIGIN` now fails closed.

Important files:

- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/common/guards/csrf-protection.guard.ts`
- `apps/web/src/lib/api.ts`
- `apps/api/test/csrf-protection.guard.spec.ts`
- `apps/api/test/auth.controller.integration.spec.ts`
- `apps/web/test/api-request.test.ts`

Coordination warning:

- Do not remove `X-Requested-With`; it is still intentional defense-in-depth.
- Do not make the CSRF cookie HttpOnly unless the frontend token flow is changed,
  because the current frontend receives the token from `/auth/csrf` and sends it
  as a header.

### S-06: Explicit Request Body Limits

Status: done.

Implemented behavior:

- Nest implicit body parser is disabled in `main.ts`.
- Explicit JSON and URL-encoded parsers are registered.
- Default limit is `100kb`, configurable via `REQUEST_BODY_LIMIT`.

Important files:

- `apps/api/src/main.ts`
- `apps/api/.env.example`
- `README.md`

### S-07: Financial DTO Bounds

Status: done.

Implemented behavior:

- Transaction amount must be positive and within a maximum financial bound.
- Budget and goal values have positive/max bounds.
- Manual quote, portfolio transaction, and dividend decimal strings have
  financial decimal validation.
- Transaction query `limit` was reduced from `5000` to `200`.
- User-controlled text fields received max lengths.

Important files:

- `apps/api/src/common/validators/financial-values.ts`
- `apps/api/src/modules/**/dto/*.ts`
- `apps/api/test/financial-dto-validation.spec.ts`

Why this matters:

- Prevents malformed, negative, oversized, or unbounded values from polluting
  financial reports and stressing storage/UI/logging.

## Verification Already Run

After the latest security implementation, these passed:

```bash
npm run test:api
npm run test:web
npm run lint
npm run build:api
npm run build:web
```

Observed successful API result:

- 14 test suites passed.
- 61 API tests passed.

Observed successful web result:

- 5 test files passed.
- 12 web tests passed.

Note:

- API integration tests using Supertest need permission to open local ports in
  the Codex sandbox. If they fail with `listen EPERM: operation not permitted
  0.0.0.0`, rerun with elevated sandbox permission.

## Supabase Migration Status

These migrations were applied in order through `psql` on 2026-06-01:

1. `supabase/migrations/20260531120000_harden_custom_auth_tables.sql`
2. `supabase/migrations/20260531123000_add_refresh_token_family.sql`
3. `supabase/migrations/20260531124000_add_security_events.sql`

Important operational details:

- `20260531120000` hardens `users` and `refresh_tokens`.
- `20260531123000` adds refresh-token family tracking.
- `20260531124000` creates `security_events`.
- The Prisma schema already expects the new columns/models.

Validation queries confirmed:

- `refresh_tokens.family_id` exists.
- `refresh_tokens.replaced_by_token_id` exists.
- `public.security_events` exists.
- RLS is enabled for `users`, `refresh_tokens`, and `security_events`.

If another environment is used later, apply the same migrations before deploying
the new API code there. Refresh-token operations depend on those columns and the
`security_events` table.

## What Still Remains From The Report

Tracked in `SECURITY_STATUS.md`:

- S-01: dependency vulnerability upgrade pass.
- S-08: heavy user-scoped read controls beyond current throttles/cache.
- S-09: security event logging for rate-limit blocks and repeated
  authorization failures.
- S-10: optional final refresh-cookie prefix hardening after production topology
  is fixed.
- S-01: dependency vulnerability upgrade pass.

Completed or documented since the original report:

- S-05: Swagger is disabled in production application code.
- S-10: deployment cookie strategy is documented.
- S-11: chart style keys/colors are constrained before dynamic CSS injection.
- S-12: `TRUST_PROXY` deployment assumptions and verification steps are
  documented.

Recommended next order:

1. S-09: add security events for rate-limit blocks and repeated authorization
   failures if an admin review surface is added.
2. S-08: add materialized/cached report snapshots if real portfolio datasets
   grow.
3. S-01: dependency upgrade pass. Highest operational risk because it may
   require Nest/Vite/Swagger major upgrades.

Security requirement and deployment documents:

- `docs/security/SECURITY_REQUIREMENTS.md`
- `docs/security/DEPLOYMENT_SECURITY.md`

## Coordination Rules For Two Sessions

Before either session starts coding:

1. Run `git status --short`.
2. Check whether the other session has modified the same files.
3. Avoid editing broad shared files at the same time:
   - `apps/api/src/modules/auth/auth.service.ts`
   - `apps/api/src/modules/auth/auth.repository.ts`
   - `apps/api/prisma/schema.prisma`
   - `apps/api/src/main.ts`
   - `apps/web/src/lib/api.ts`
   - `SECURITY_STATUS.md`
4. If one session works on dependencies, the other should avoid package files:
   - `package.json`
   - `package-lock.json`
   - `apps/api/package.json`
   - `apps/web/package.json`
5. If one session works on migrations, the other should avoid Prisma schema and
   Supabase migration files.

Suggested split:

- Session A: S-01 dependency pass.
- Session B: S-08/S-09 operational hardening, but only after checking current
  Git state.

Avoid doing S-01 in parallel with other API work. Dependency upgrades can create
large lockfile churn and framework-level breakage.

## Quick Explanation In Plain Language

FinanceBuddy now has a stronger security story:

- Authentication has short-lived access tokens and refresh-token rotation.
- If someone steals an old refresh token and tries to reuse it, the system now
  logs that event and invalidates the compromised session family.
- Cookie-authenticated endpoints now require a real CSRF token, not just a
  browser header.
- Request bodies have a configured size limit.
- Financial inputs now have bounds, so invalid values cannot silently distort
  reports.
- Swagger is local-only, heavy report/quote endpoints are throttled, and chart
  CSS injection is constrained.
- Security status is tracked in a dedicated file so future work can continue
  without guessing what was already completed.
