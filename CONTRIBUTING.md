# Contributing to FinanceBuddy

Thank you for helping improve FinanceBuddy. This repository is both an open-source personal finance application and a portfolio case study, so contributions should keep the product useful, the implementation explainable, and the handling of financial data safe.

## Before you start

1. Read the [README](./README.md) for the architecture, prerequisites, database workflow, and local setup.
2. Search existing issues before opening a new one.
3. Use a GitHub issue to discuss substantial product or architectural changes before investing in a large implementation.
4. Report vulnerabilities privately as described in [SECURITY.md](./SECURITY.md)—never in a public issue.

## Local development

FinanceBuddy requires Node.js `>=22.12`, npm, and a Supabase PostgreSQL project.

```bash
git clone https://github.com/salmoriadev/FinanceBuddy.git
cd FinanceBuddy
npm ci
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Apply the ordered SQL files under `supabase/migrations/`, configure the two local `.env` files, then start the workspaces in separate terminals:

```bash
npm run prisma:generate --workspace=apps/api
npm run dev:api
npm run dev:web
```

Use synthetic local data. Do not copy production records, real account balances, personal identifiers, tokens, or credentials into a development database.

## Branches and commits

- Branch from an up-to-date `main`.
- Use a short descriptive branch name such as `feat/budget-filters`, `fix/refresh-rotation`, or `docs/local-setup`.
- Keep each pull request focused on one coherent outcome.
- Write concise, imperative, conventional-style commits, for example `feat(web): add budget period filter` or `fix(api): scope report query by user`.
- Do not mix generated artifacts, unrelated formatting, or dependency churn into a feature commit.

## Implementation expectations

- Preserve the web/API trust boundary: the browser must not access PostgreSQL directly.
- Keep financial resources scoped to the authenticated user at repository and service boundaries.
- Add or update tests for behavior, authorization, validation, and regressions.
- Keep TypeScript types explicit at network and persistence boundaries.
- Never weaken CSRF, cookie, token, CORS, throttling, validation, or anti-enumeration controls to make a test pass.
- Add new database changes as timestamped SQL files under `supabase/migrations/` and update `apps/api/prisma/schema.prisma` in the same pull request. Do not rewrite migrations that may already have been applied.
- Use `npm install` from the repository root so dependency changes update the root `package-lock.json`.

## Required checks

Run the complete quality gate before opening a pull request:

```bash
npm run check
npm audit --audit-level=high
```

`npm run check` runs API and web tests, web linting, both TypeScript checks, and both production builds. If a check cannot run locally, explain why and include the remaining verification plan in the pull request.

## Pull requests

Describe:

- The user or engineering problem being solved.
- The chosen approach and important trade-offs.
- Tests added or updated and the commands you ran.
- Any database, environment, deployment, privacy, or security impact.
- Screenshots for visible UI changes, using synthetic data only.

Keep secrets and sensitive data out of descriptions, screenshots, logs, fixtures, commits, and review comments. Redact access tokens, cookies, database URLs, email addresses, account values, and any real financial information.

By contributing, you agree that your contribution will be licensed under the repository's [MIT License](./LICENSE).
