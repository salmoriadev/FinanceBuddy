# FinanceBuddy Security Requirements

Last updated: 2026-06-01

This document turns the security backlog into explicit implementation
requirements. It is the checklist for making FinanceBuddy read as a focused
AppSec/DevSecOps portfolio case for a personal finance product.

## Security Scope

FinanceBuddy protects user-owned financial data through a NestJS API, React web
client, Prisma, and Supabase Postgres. The security work should strengthen the
existing product instead of changing its purpose.

Primary goals:

- Keep one user's financial data isolated from every other user.
- Keep authentication resilient against token theft and CSRF.
- Make risky production settings explicit and testable.
- Provide CI evidence for tests, scans, and security controls.

## Requirement Status

| ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| S-01 | Upgrade vulnerable production dependencies in a controlled pass. | Done | `package-lock.json`, `.github/workflows/security.yml` |
| S-02 | Detect refresh-token reuse and revoke the compromised token family. | Done | `apps/api/src/modules/auth/auth.service.ts`, `apps/api/test/auth.service.spec.ts` |
| S-03 | Harden custom auth tables with RLS and client-role denial. | Done and applied | `supabase/migrations/20260531120000_harden_custom_auth_tables.sql` |
| S-04 | Require explicit CSRF tokens for cookie-authenticated auth routes. | Done | `apps/api/src/common/guards/csrf-protection.guard.ts`, `apps/web/src/lib/api.ts` |
| S-05 | Prevent Swagger/OpenAPI docs from being exposed in production. | Done | `apps/api/src/main.ts` |
| S-06 | Set explicit request body limits. | Done | `apps/api/src/main.ts`, `apps/api/.env.example` |
| S-07 | Add financial DTO bounds for amounts, pagination, names, notes, and tickers. | Done | `apps/api/src/common/validators/financial-values.ts` |
| S-08 | Add resource controls for heavy user-scoped reads and quote refreshes. | Partial | Reports are cached and heavy endpoints have route throttles. |
| S-09 | Persist security events for authentication and session activity. | Partial | Auth events are logged; rate-limit and repeated authorization events remain. |
| S-10 | Define production refresh-cookie strategy by deployment topology. | Documented | `docs/security/DEPLOYMENT_SECURITY.md` |
| S-11 | Constrain dynamic chart CSS injection. | Done | `apps/web/src/components/ui/chart.tsx`, `apps/web/test/chart-security.test.ts` |
| S-12 | Document and verify `TRUST_PROXY` per deployment target. | Documented | `docs/security/DEPLOYMENT_SECURITY.md` |

## Acceptance Criteria

### S-01: Dependency Upgrade Pass

- `npm audit --omit=dev --audit-level=high` has no high or critical production
  advisories.
- NestJS, Swagger, Vite, Vitest, and related packages are upgraded in a
  controlled grouped pass.
- CI audit is blocking.
- API tests, web tests, lint, and builds pass after the upgrade.

### S-05: Swagger Production Protection

- Swagger is available in local development by default.
- `NODE_ENV=production` does not expose `/docs`, even if `ENABLE_SWAGGER=true`
  is accidentally configured.
- README states that production API docs are intentionally disabled.

### S-08: Heavy Read Controls

- Transaction pagination remains capped at a UI-sized value.
- Reports and portfolio audit/monthly report endpoints have route-level
  throttles.
- Quote refresh endpoints have stricter throttles than normal reads.
- Future larger datasets should move portfolio/report calculations to cached or
  materialized snapshots instead of unbounded request-time scans.

### S-09: Security Event Audit Trail

- Do log: registration, login success, login failure, refresh rotation, refresh
  reuse, refresh expiry, logout, password-change success, and password-change
  failure.
- Do log: rate-limit blocks as `rate_limit_blocked` with method, normalized
  route, configured limit, TTL, total hits, and block-expiry metadata.
- Do log: repeated authorization failures as
  `repeated_authorization_failure` after five `401`, `403`, or `404` responses
  for the same IP, method, and normalized route within ten minutes.
- Do not log: raw passwords, raw refresh tokens, access tokens, session cookies,
  request bodies, or raw email addresses.
- Email correlation must use a one-way hash.
- The admin review API is `GET /api/v1/security/events`; it requires a valid JWT
  and a case-insensitive email match in `SECURITY_ADMIN_EMAILS`.
- Admin event queries may filter by `type`, `severity`, `userId`, `from`, `to`,
  and `limit`; `limit` defaults to 50 and is capped at 100.
- Event responses must expose only sanitized event fields: `id`, `userId`,
  `type`, `severity`, `metadata`, `userAgent`, `ipAddress`, and `createdAt`.

### S-10: Refresh Cookie Strategy

- Local development uses `SameSite=Lax`, no `COOKIE_DOMAIN`, and non-secure
  cookies unless served over TLS.
- Same-site production should prefer `COOKIE_SAMESITE=lax`.
- Cross-site production must use `COOKIE_SAMESITE=none` and HTTPS.
- `COOKIE_DOMAIN` must stay empty unless the API and web app intentionally share
  a parent domain.

### S-11: Chart Style Injection

- Chart CSS variable names must be limited to safe suffixes.
- Chart color values must match known-safe CSS color formats.
- Unsafe CSS delimiters such as `;`, `{`, `}`, `<`, `>`, and backslashes must be
  rejected before `dangerouslySetInnerHTML`.
- Tests must cover allowed values and rejected injection attempts.

### S-12: Trust Proxy

- `TRUST_PROXY=false` locally.
- In production, enable `TRUST_PROXY=true` only behind a known single-hop proxy
  that overwrites forwarded headers.
- Verify request logs show the real client IP after deployment.
- Do not configure unrestricted proxy trust.

## Verification Commands

Run these after every security implementation batch:

```bash
npm run test:api
npm run test:web
npm run lint
npm run build:api
npm run build:web
```
