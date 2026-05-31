# Security Notes

FinanceBuddy is a personal finance application designed around user-owned
financial data. The core security goal is that one authenticated user must not
be able to read or mutate another user's transactions, categories, budgets,
goals, assets, portfolios, dividends, or reports by changing request IDs.

## Main Risks

- Broken Object Level Authorization / IDOR across financial resources
- Broken authentication or weak session handling
- Refresh token theft or reuse
- CSRF against cookie-based refresh and logout endpoints
- Brute-force login attempts
- Sensitive financial data exposure
- Security misconfiguration in API or CORS settings
- Leaked secrets in repository history or pull requests

## Implemented Controls

- Argon2id password hashing with a server-side pepper
- Short-lived JWT access tokens
- Rotating refresh tokens stored as hashes
- HttpOnly refresh token cookies
- CSRF protection on cookie-authenticated endpoints
- Rate limiting globally and tighter limits on auth endpoints
- DTO validation with NestJS `ValidationPipe`
- Ownership checks using `userId` scoped repositories and services
- Anti-enumeration behavior for user-owned resources by returning `404` when a
  resource does not belong to the authenticated user
- Automated tests for authorization boundaries and API protections

## OWASP API Security Alignment

FinanceBuddy focuses on the risks that matter most for a personal finance API:

- API1: Broken Object Level Authorization
- API2: Broken Authentication
- API3: Broken Object Property Level Authorization
- API4: Unrestricted Resource Consumption
- API8: Security Misconfiguration

## AppSec Scenario

The most important security scenario is preventing cross-user financial data
access. For example, if user A changes an ID in a request to reference user B's
transaction, budget, goal, asset, portfolio, or report, the API must reject it.

Expected results:

- Missing or invalid access token: `401 Unauthorized`
- Category owned by another user: `403 Forbidden`
- User-owned financial resource that does not belong to the caller: `404 Not Found`

Returning `404` for another user's resource is intentional. It avoids confirming
that the target record exists.

## DevSecOps Checks

Security checks run in GitHub Actions for pull requests and pushes to `main`:

- Secret scanning with Gitleaks
- SAST with Semgrep OWASP rules
- Filesystem vulnerability scanning with Trivy
- Dependency checks with `npm audit --audit-level=high`

Trivy runs in filesystem mode because this repository does not currently ship a
Dockerfile. Container image scanning should be added only if a production image
is introduced.

The dependency audit job is currently informational because the existing
dependency tree includes advisories that require a separate upgrade pass,
including some major-version framework updates. Keeping the job visible makes
that security debt explicit without blocking unrelated portfolio improvements.
