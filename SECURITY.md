# Security Policy

FinanceBuddy handles user-owned financial records, so security reports are taken seriously even though this is a portfolio project and not audited financial software.

## Reporting a vulnerability

After private vulnerability reporting is enabled for the public repository, the
preferred channel is [GitHub Security
Advisories](https://github.com/salmoriadev/FinanceBuddy/security/advisories/new).
If that form is unavailable, email the monitored maintainer address at
[salmoria.dev@gmail.com](mailto:salmoria.dev@gmail.com) with
`FinanceBuddy security report` in the subject line.

Do **not** open a public issue, discussion, or pull request for an undisclosed vulnerability. Do not include secrets, active credentials, access or refresh tokens, database connection strings, real financial records, or other people's personal data in a report. Use the smallest synthetic proof of concept that demonstrates the issue.

A useful report includes:

- The affected component, route, or commit.
- The vulnerability class and expected security boundary.
- Reproduction steps using synthetic data.
- The likely impact and any prerequisites.
- A suggested mitigation, if you have one.

This project is maintained as an open-source portfolio, so no formal response SLA is promised. The maintainer will coordinate validation, remediation, and disclosure through the private advisory whenever possible. Please allow a reasonable remediation window before public disclosure.

## Supported versions

FinanceBuddy is currently pre-1.0 and does not publish stable binary releases.

| Version | Supported |
| --- | --- |
| Latest commit on `main` | Yes |
| Older commits, forks, or modified deployments | No |

Security fixes are applied to `main`. Operators are responsible for their own deployment configuration, secrets, database access, and timely updates.

## Security model

The primary security goal is strict isolation of user-owned financial data. An authenticated user must not be able to read or mutate another user's transactions, categories, budgets, goals, assets, portfolios, dividends, security events, or reports by changing identifiers in an API request.

The principal risks considered by the project are:

- Broken Object Level Authorization (BOLA/IDOR).
- Broken authentication and session handling.
- Refresh-token theft, replay, or reuse.
- CSRF against cookie-authenticated refresh and logout operations.
- Brute-force and resource-exhaustion attacks.
- Sensitive financial data or secret exposure.
- Unsafe CORS, proxy, cookie, API documentation, or database configuration.

## Implemented controls

- Argon2id password hashing with optional server-side peppering.
- Short-lived JWT access tokens.
- Hashed refresh tokens in HttpOnly cookies, with token-family rotation links and reuse detection.
- Double-submit CSRF tokens for cookie-authenticated session operations.
- Global rate limiting and tighter route limits for authentication, reporting, and market-data operations.
- Explicit request body and form-parameter limits.
- NestJS DTO validation with unknown fields rejected.
- Bounds for money, quantities, pagination, names, notes, and tickers.
- User-scoped repository and service queries for financial resources.
- Anti-enumeration responses for resources outside the caller's ownership scope.
- PostgreSQL RLS and client-role denial policies for API-managed authentication tables.
- Persisted, sanitized security events for authentication, session, throttling, and repeated authorization activity.
- An authenticated security-event review route restricted by immutable user
  UUIDs in `SECURITY_ADMIN_USER_IDS`; account email does not grant access.
- Runtime Swagger disabled in production.
- Constrained chart-style generation before dynamic CSS injection.
- Automated authorization, authentication, CSRF, validation, throttling, event, and integration tests.

## Automated security checks

GitHub Actions runs the following blocking checks on pull requests and pushes to `main`:

- Gitleaks secret scanning.
- Semgrep SAST with OWASP rules.
- Trivy filesystem scanning for fixed high and critical vulnerabilities.
- `npm audit --audit-level=high` for dependency advisories.

The committed dependency tree is expected to pass the npm audit gate with zero known advisories at the configured threshold. A high or critical dependency finding fails CI; it is not informational.

## Operational responsibility

Repository controls do not replace secure deployment practices. Operators must use unique secrets, restrict database access, apply all ordered Supabase SQL migrations, configure an exact CORS origin, choose the correct cookie policy, validate trusted-proxy topology, protect logs, and keep dependencies current.

See the [security requirements](./docs/security/SECURITY_REQUIREMENTS.md), [deployment security checklist](./docs/security/DEPLOYMENT_SECURITY.md), and [implementation status](./SECURITY_STATUS.md) for additional detail.

FinanceBuddy has not been independently audited and should not be treated as banking infrastructure. It does not provide financial, investment, tax, or legal advice. Public demos, bug reports, tests, and screenshots should use synthetic data only.
