# FinanceBuddy Security Status

Last updated: 2026-08-21

This file records the repository's implemented security improvements and
remaining operational work. The current review and acceptance criteria live in
`docs/security/SECURITY_REVIEW.md` and
`docs/security/SECURITY_REQUIREMENTS.md`.

## Done

### S-01: Dependency Vulnerability Upgrade Pass

**Status:** Done

Implemented controls:

- Upgraded NestJS API packages from 10.x to 11.x as a coordinated framework
  pass.
- Upgraded Swagger, throttler, config, Vite, Vitest, PostCSS, and related
  tooling.
- Removed the development-only `lovable-tagger` Vite plugin because it is not
  compatible with Vite 8 and kept an older vulnerable Vite/esbuild tree in the
  lockfile.
- Ran `npm audit fix` and `npm dedupe` to clean vulnerable transitive
  dependencies.
- Verified `npm audit --audit-level=high` reports `found 0 vulnerabilities`.
- Made the GitHub Actions dependency audit blocking.

Main files:

- `apps/api/package.json`
- `apps/web/package.json`
- `apps/web/vite.config.ts`
- `package-lock.json`
- `.github/workflows/security.yml`

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

**Status:** Done and applied to the configured Supabase/Postgres database on
2026-06-01

Implemented controls:

- Enabled RLS on API-managed `users` and `refresh_tokens`.
- Revoked direct access from Supabase `anon` and `authenticated` roles.
- Added explicit deny policies for browser-facing roles.
- Verified `users`, `refresh_tokens`, and `security_events` have RLS enabled.

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

### S-05: Swagger Production Protection

**Status:** Done

Implemented controls:

- Swagger is enabled in development by default.
- Production no longer exposes Swagger at runtime, even if
  `ENABLE_SWAGGER=true` is accidentally set.
- Deployment documentation now recommends private/static API docs if production
  docs are needed later.

Main files:

- `apps/api/src/main.ts`
- `README.md`
- `docs/security/DEPLOYMENT_SECURITY.md`

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

### S-09: Security Event Audit Trail

**Status:** Done

Implemented:

- Added `security_events` table.
- Persisted `refresh_token_reuse` events.
- Persisted registration, login success/failure, refresh rotation, refresh
  expiry, logout, password-change success, and password-change failure events.
- Raw emails are not stored in security event metadata; login correlation uses a
  one-way hash.
- Rate-limit blocks are logged as `rate_limit_blocked` events with method,
  normalized route, limit, TTL, hit count, and block-expiry metadata. Events are
  deduplicated per tracker, throttler, and route during each block window, and
  audit persistence never delays the `429` response.
- Repeated `401`, `403`, and `404` responses are logged as
  `repeated_authorization_failure` after five failures for the same IP, method,
  and normalized route within ten minutes.
- Auth endpoints that already emit auth-specific events are excluded from
  repeated authorization failure detection.
- `GET /api/v1/security/events` exposes newest-first event review for JWT users
  whose immutable user UUID is listed in `SECURITY_ADMIN_USER_IDS`; malformed
  configuration entries are ignored and an empty allowlist denies all access.
- Production retention is an operational responsibility: keep
  `security_events` for at least 90 days and treat them as sensitive
  operational data. Alerting and incident-response integration remain
  deployment concerns rather than repository controls.

### S-11: Dynamic Chart Style Injection Constraints

**Status:** Done

Implemented controls:

- Chart CSS variable suffixes are allowlisted before style injection.
- Chart color values are limited to safe hex, CSS variable, RGB(A), and HSL(A)
  formats.
- CSS delimiter characters that could break declarations are rejected.
- Tests cover safe values and rejected CSS injection attempts.

Main files:

- `apps/web/src/components/ui/chart.tsx`
- `apps/web/src/components/ui/chart-style.ts`
- `apps/web/test/chart-security.test.ts`

## Partially Done

### S-08: Heavy User-Scoped Read Controls

**Status:** Partially done

Implemented:

- Transaction pagination is capped at 200.
- Reports service uses short-lived per-user/year cache entries.
- Heavy report, portfolio audit/monthly report, quote lookup, and quote refresh
  endpoints have stricter route-level throttles than the global API limit.

Remaining:

- Add materialized/cached portfolio report snapshots if real datasets grow.
- Add endpoint-specific metrics before tuning limits further.

## Documented

### S-10: Refresh Cookie Hardening

**Status:** Documented

Implemented:

- Documented cookie strategy for local, same-site production, and cross-site
  production deployments.
- Documented when to use `COOKIE_SAMESITE=lax` versus `COOKIE_SAMESITE=none`.
- Documented keeping `COOKIE_DOMAIN` empty unless subdomain sharing is
  intentional.

Remaining:

- Consider `__Secure-` cookie naming after the final production domain topology
  is fixed.

### S-12: Trust Proxy Deployment Documentation

**Status:** Documented

Implemented controls:

- Documented local, same-site production, and cross-site production settings.
- Documented that `TRUST_PROXY=true` maps to one trusted proxy hop.
- Added runtime verification checklist for real client IP logging and spoofed
  forwarded headers.

Main file:

- `docs/security/DEPLOYMENT_SECURITY.md`

## Remaining

S-08 and S-10 have explicit implementation or deployment work listed above.
S-09 is complete at the repository level; its retention, alerting, and incident
response follow-up must be completed by each production operator.
