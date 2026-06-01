# FinanceBuddy Security Improvement Backlog

## Executive Summary

FinanceBuddy already has a strong security baseline for a portfolio project:
Argon2id password hashing with pepper, short-lived JWT access tokens, refresh
tokens in HttpOnly cookies, DTO validation, Helmet, rate limiting, user-scoped
repositories, RLS policies for most finance tables, and authorization tests for
IDOR/BOLA scenarios.

The next security work should focus on tightening what already exists instead
of adding unrelated features. The highest-value improvements are dependency
upgrades, stronger refresh-token reuse detection, database access hardening for
custom auth tables, CSRF hardening for cookie-authenticated endpoints, and
clearer production security posture.

## Positive Controls Already Present

- Access tokens are kept in React state instead of `localStorage` or
  `sessionStorage`: `apps/web/src/hooks/useAuth.tsx:43`.
- API requests include credentials only for the API client and use bearer access
  tokens for protected resources: `apps/web/src/lib/api.ts:44`.
- Protected API controllers use `JwtAuthGuard`, including transactions, budgets,
  goals, assets, portfolios, investments, reports, and categories.
- Global DTO validation uses whitelist and non-whitelisted rejection:
  `apps/api/src/main.ts:45`.
- Helmet is enabled: `apps/api/src/main.ts:41`.
- Refresh cookies are HttpOnly and scoped to auth routes:
  `apps/api/src/modules/auth/auth.service.ts:154`.
- Most user-owned database tables have RLS policies in Supabase migrations.
- Dedicated service-level authorization tests now cover cross-user access for
  real FinanceBuddy resources.

## High Priority

### S-01: Dependency Vulnerability Upgrade Pass

**Severity:** High

**Location:** `apps/api/package.json:22`, `apps/web/package.json:65`,
`package-lock.json`

**Evidence:** `npm audit --omit=dev --audit-level=high` currently reports 16
production dependency advisories, including high-severity advisories in
`lodash`, `multer`, `path-to-regexp`, and `picomatch`. Some fixes require
breaking upgrades such as NestJS 11 and Swagger 11.

**Impact:** Known vulnerable dependency versions weaken the AppSec/DevSecOps
story and may expose denial-of-service, prototype pollution, or route parsing
issues depending on reachable code paths.

**Fix:**

- Run a dedicated dependency upgrade phase, not `npm audit fix --force` blindly.
- Upgrade NestJS packages together and rerun API tests.
- Upgrade Swagger separately and verify docs generation.
- Upgrade Vite/PostCSS/tooling for dev-only advisories after production deps.
- Change the GitHub Actions audit job from informational to blocking once the
  dependency tree is clean.

### S-02: Refresh Token Reuse Is Rejected But Not Detected As Compromise

**Severity:** High

**Location:** `apps/api/src/modules/auth/auth.service.ts:80`

**Evidence:** On refresh, the service looks up the refresh token hash and rejects
missing or revoked tokens:

```ts
const stored = await this.repository.findRefreshTokenByHash(tokenHash);
if (!stored || stored.revokedAt) {
  throw new UnauthorizedException("Refresh token invalid");
}
```

The previous refresh token is revoked before issuing a new one:
`apps/api/src/modules/auth/auth.service.ts:101`.

**Impact:** A stolen old refresh token is denied, but token reuse is not treated
as a compromise signal. A portfolio-grade fintech auth flow should detect reuse
and revoke the related session family or all active tokens for that user.

**Fix:**

- Add a refresh-token family/session identifier.
- Store `replacedByTokenId` or similar metadata when rotating.
- If a revoked token is presented, revoke the whole family or all user tokens.
- Add tests for refresh token reuse detection and family revocation.

### S-03: Custom Auth Tables Do Not Show RLS/Privilege Hardening

**Severity:** High

**Location:** `supabase/migrations/20260202120000_add_auth_tables.sql:7`

**Evidence:** `users` and `refresh_tokens` are created in `public`, but this
migration does not enable RLS or define policies:

```sql
CREATE TABLE IF NOT EXISTS public.users (...)
CREATE TABLE IF NOT EXISTS public.refresh_tokens (...)
```

Other finance tables do enable RLS, for example investments and portfolio
tables in later migrations.

**Impact:** The API currently owns access through Prisma, but if Supabase REST,
GraphQL, anon roles, or direct database credentials are exposed later, auth data
could be a high-impact target. `refresh_tokens` stores token hashes and device
metadata; `users` stores password hashes.

**Fix:**

- Enable RLS on `public.users` and `public.refresh_tokens`.
- Add deny-by-default policies for client roles, or move auth tables to a
  private schema only reachable by the API role.
- Explicitly verify grants for `anon` and `authenticated` Supabase roles.
- Document that frontend must never talk directly to these tables.

## Medium Priority

### S-04: CSRF Protection Is Header/Origin-Based, Not Token-Based

**Severity:** Medium

**Location:** `apps/api/src/common/guards/csrf-protection.guard.ts:29`,
`apps/api/src/modules/auth/auth.controller.ts:56`

**Evidence:** Refresh and logout require `X-Requested-With: XMLHttpRequest` and,
in production, origin/referer matching. If `CORS_ORIGIN` is empty in production,
the guard allows the request after the custom header check:
`apps/api/src/common/guards/csrf-protection.guard.ts:48`.

**Impact:** The current protection is reasonable for the narrow refresh/logout
surface, but it is not as strong or explicit as a signed/double-submit CSRF
token. If CORS is accidentally widened, the header check becomes weaker.

**Fix:**

- Add a CSRF token endpoint or issue a readable CSRF cookie.
- Require matching `X-CSRF-Token` on cookie-authenticated state-changing routes.
- Fail closed in production when `CORS_ORIGIN` is not configured.
- Keep the origin/referer check as defense-in-depth.

### S-05: Swagger Can Be Exposed In Production

**Severity:** Medium

**Location:** `apps/api/src/main.ts:55`

**Evidence:** Swagger is enabled outside production or when
`ENABLE_SWAGGER=true`:

```ts
const enableSwagger =
  !isProd || configService.get<string>("ENABLE_SWAGGER") === "true";
```

**Impact:** Public API docs are useful for development, but in production they
make endpoint discovery easier and may expose internal assumptions.

**Fix:**

- Keep Swagger disabled in production by default.
- If needed in production, protect it with basic auth, IP allowlist, or a private
  admin route.
- Add a startup warning when `ENABLE_SWAGGER=true` and `NODE_ENV=production`.

### S-06: Request Body Limits Are Not Explicit

**Severity:** Medium

**Location:** `apps/api/src/main.ts:17`

**Evidence:** The app uses Nest's default Express body parser behavior. There is
no explicit JSON or URL-encoded size limit near the bootstrap middleware stack.

**Impact:** Defaults may be acceptable today, but explicit limits are clearer and
reduce resource-consumption risk as endpoints grow.

**Fix:**

- Configure explicit JSON and URL-encoded limits, for example `100kb` or lower
  for normal API routes.
- Add a larger limit only to endpoints that genuinely need it.
- Test oversized payloads return `413`.

### S-07: Financial DTOs Need Stronger Business Bounds

**Severity:** Medium

**Location:** examples include
`apps/api/src/modules/transactions/dto/create-transaction.dto.ts:22`,
`apps/api/src/modules/budgets/dto/create-budget.dto.ts:12`,
`apps/api/src/modules/assets/dto/create-asset.dto.ts:16`,
`apps/api/src/modules/portfolios/dto/create-portfolio-transaction.dto.ts:33`

**Evidence:** Several financial inputs validate type but not domain limits. For
example, transactions and budgets convert to number but do not enforce positive
amounts. Many text fields have `MinLength` but no `MaxLength`.

**Impact:** This is mostly data integrity and abuse resistance, but for a
finance app it matters: negative or huge values can distort reports, and
unbounded strings can increase storage/log/UI risk.

**Fix:**

- Add `@Min(0)` or `@Min(0.01)` where values must be positive.
- Add realistic `@Max` limits for money, quantity, pagination, and years.
- Add `@MaxLength` for names, notes, tickers, sectors, source, and currency.
- Add tests for rejected invalid financial values.

### S-08: Heavy User-Scoped Reads Need Tighter Resource Controls

**Severity:** Medium

**Location:** `apps/api/src/modules/transactions/dto/transactions-query.dto.ts:13`,
`apps/api/src/modules/portfolios/portfolios.repository.ts:191`,
`apps/api/src/modules/portfolios/portfolios.controller.ts:67`

**Evidence:** Transaction pagination allows up to 5000 rows, and portfolio
monthly reports can load all transactions until a month end. This is user-scoped,
but still attacker-controlled after login.

**Impact:** A malicious or compromised user account can generate expensive reads
and degrade API/database performance.

**Fix:**

- Lower transaction `limit` to a normal UI value, such as 100 or 200.
- Add date/window bounds and pagination for audit/report endpoints.
- Cache or materialize position/report calculations as the portfolio feature
  grows.
- Add rate limits for quote refresh and report endpoints.

### S-09: Security Event Audit Trail Is Thin

**Severity:** Medium

**Location:** `apps/api/src/common/interceptors/logging.interceptor.ts:23`,
`apps/api/src/modules/auth/auth.service.ts:62`

**Evidence:** The current interceptor logs successful request method/path/status,
but auth events such as failed login, password change, refresh reuse, token
revocation, and suspicious cross-user access attempts are not persisted as
security events.

**Impact:** When something goes wrong, there is limited forensic visibility.
This is an important portfolio differentiator for AppSec/DevSecOps.

**Fix:**

- Add a `security_events` table.
- Log failed login, successful login, logout, refresh, refresh reuse, password
  change, rate-limit blocks, and repeated authorization failures.
- Avoid logging secrets, raw tokens, passwords, or full request bodies.
- Add retention policy and admin-only reporting later.

## Low Priority

### S-10: Refresh Cookie Can Be Hardened Further

**Severity:** Low

**Location:** `apps/api/src/modules/auth/auth.service.ts:210`

**Evidence:** The refresh cookie is HttpOnly, Secure in production, and scoped to
`/api/v1/auth`. Production defaults to `SameSite=None` unless configured.

**Impact:** This is already reasonable for cross-site frontend/backend
deployments, but `SameSite=None` expands CSRF exposure and the cookie name has no
secure prefix.

**Fix:**

- Prefer `SameSite=Lax` when frontend and backend are same-site.
- Use `__Secure-refresh_token` in production, or `__Host-` only if path/domain
  requirements are compatible.
- Document the cookie strategy for Vercel + Render/Koyeb deployment.

### S-11: Dynamic Chart Style Injection Should Be Constrained

**Severity:** Low

**Location:** `apps/web/src/components/ui/chart.tsx:83`

**Evidence:** The chart component uses `dangerouslySetInnerHTML` to inject CSS
variables from chart config.

**Impact:** Current usage appears internal and controlled, so this is not a
confirmed XSS issue. It is still a risky sink worth constraining because future
chart config could include API-provided values.

**Fix:**

- Validate chart color values against a strict color allowlist.
- Ensure chart config keys are safe CSS variable suffixes.
- Keep this component off-limits for user-provided HTML/CSS.

### S-12: Trust Proxy Configuration Needs Deployment Verification

**Severity:** Low

**Location:** `apps/api/src/main.ts:20`

**Evidence:** `trust proxy` is enabled only when `TRUST_PROXY` is set to `1` or
`true`, and then configured as one proxy hop.

**Impact:** If deployed behind a proxy without correct trust settings, rate
limiting and audit IPs may be inaccurate. If configured too broadly, spoofed
forwarded headers can affect IP-derived controls.

**Fix:**

- Document exact values per host: local, Render/Koyeb, and any reverse proxy.
- Add a deployment checklist item to verify real client IPs in logs.
- Keep `trust proxy` pinned to a known hop count, not unrestricted `true`.

## Recommended Implementation Order

1. Fix production dependency advisories with a controlled upgrade pass.
2. Add refresh token family/reuse detection and tests.
3. Harden `users` and `refresh_tokens` table access/RLS/grants.
4. Replace CSRF header-only guard with token-based CSRF for refresh/logout.
5. Add DTO bounds for money, quantities, notes, names, and pagination.
6. Add security event audit logging.
7. Protect or fully disable Swagger in production.
8. Add explicit request body limits and oversized payload tests.
9. Tighten report/query resource limits.
10. Document deployment cookie/proxy settings.
