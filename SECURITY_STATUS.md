# FinanceBuddy Security Status

Last updated: 2026-05-31

This file tracks the security improvement backlog from
`security_best_practices_report.md` and records what has been implemented.

## Done

### S-02: Refresh Token Reuse Detection

**Status:** Done

Implemented controls:

- Refresh tokens have a `family_id` to group a session chain.
- Refresh rotation stores `replaced_by_token_id` on the old token.
- Reusing a revoked refresh token writes a `refresh_token_reuse` security event.
- Reusing a revoked refresh token revokes the active tokens in that family.
- Unit tests cover unknown token handling, token-family rotation, and reuse
  detection.

Main files:

- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.repository.ts`
- `apps/api/test/auth.service.spec.ts`
- `supabase/migrations/20260531123000_add_refresh_token_family.sql`
- `supabase/migrations/20260531124000_add_security_events.sql`

### S-03: Auth Table RLS And Client Role Denial

**Status:** Done in code, pending Supabase migration application

Implemented controls:

- Enabled RLS on API-managed `users` and `refresh_tokens`.
- Revoked direct access from Supabase `anon` and `authenticated` roles.
- Added explicit deny policies for browser-facing roles.

Main file:

- `supabase/migrations/20260531120000_harden_custom_auth_tables.sql`

### S-04: Explicit CSRF Token

**Status:** Done

Implemented controls:

- Added `GET /auth/csrf` to issue a CSRF token.
- Added a double-submit check requiring `csrf_token` cookie and
  `X-CSRF-Token` header to match.
- Kept `X-Requested-With` and production origin validation as defense-in-depth.
- Production now fails closed when `CORS_ORIGIN` is missing.
- Frontend API client fetches and sends CSRF tokens for mutating requests.

Main files:

- `apps/api/src/common/guards/csrf-protection.guard.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/web/src/lib/api.ts`

### S-06: Explicit Request Body Limits

**Status:** Done

Implemented controls:

- Disabled implicit body parser setup.
- Added explicit JSON and URL-encoded body limits.
- Added `REQUEST_BODY_LIMIT=100kb` to API env documentation.

Main files:

- `apps/api/src/main.ts`
- `apps/api/.env.example`
- `README.md`

### S-07: Financial DTO Bounds

**Status:** Done

Implemented controls:

- Added positive/max bounds to transaction, budget, goal, quote, portfolio
  transaction, and dividend values.
- Lowered transaction list limit from 5000 to 200.
- Added max length constraints for user-controlled names, notes, tickers,
  sectors, sources, icons, colors, and currencies.
- Added DTO validation tests for invalid financial values.

Main files:

- `apps/api/src/common/validators/financial-values.ts`
- `apps/api/src/modules/**/dto/*.ts`
- `apps/api/test/financial-dto-validation.spec.ts`

## Partially Done

### S-09: Security Event Audit Trail

**Status:** Partially done

Implemented:

- Added `security_events` table.
- Persisted `refresh_token_reuse` events.

Remaining:

- Log failed login, password change, logout, rate-limit blocks, and repeated
  authorization failures.
- Add reporting/retention strategy.

## Remaining

### S-01: Dependency Vulnerability Upgrade Pass

**Status:** Todo

Remaining:

- Upgrade vulnerable production dependencies in a controlled pass.
- Make `npm audit --audit-level=high` blocking once advisories are resolved.

### S-05: Swagger Production Protection

**Status:** Todo

Remaining:

- Protect Swagger in production or hard-disable it regardless of
  `ENABLE_SWAGGER=true`.

### S-08: Heavy User-Scoped Read Controls

**Status:** Todo

Remaining:

- Add stronger limits/caching for report and audit endpoints as portfolio data
  grows.

### S-10: Refresh Cookie Hardening

**Status:** Todo

Remaining:

- Decide deployment cookie strategy for same-site vs cross-site frontend/API.
- Consider `__Secure-` cookie naming in production.

### S-11: Dynamic Chart Style Injection Constraints

**Status:** Todo

Remaining:

- Constrain chart color keys and values before injecting style content.

### S-12: Trust Proxy Deployment Verification

**Status:** Todo

Remaining:

- Document `TRUST_PROXY` values per deployment target and verify client IP logs.
