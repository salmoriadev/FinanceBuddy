# FinanceBuddy

![CI](https://github.com/arthursalmoria/FinanceBuddy/actions/workflows/ci.yml/badge.svg)
![Security Checks](https://github.com/arthursalmoria/FinanceBuddy/actions/workflows/security.yml/badge.svg)

FinanceBuddy is a personal finance app built with React, NestJS, Prisma, and Postgres. It covers day-to-day tracking, budgeting, goals, investment events, reports, and authenticated API access.

## Highlights

- **Dashboard** with monthly balance, income vs. expenses, savings rate, and visual charts
- **Transactions** with categories, filters, recurring income/expense automation
- **Budgets & Goals** with progress bars and quick updates
- **Investments** with assets, portfolio events, quotes, dividends, and monthly reports
- **Reports** with comparisons, monthly evolution, and category breakdowns
- **Account settings** for language and currency

## Portfolio Highlights

- Secure authentication with Argon2id + pepper, short-lived JWT access tokens, rotating refresh tokens, and HttpOnly refresh cookies
- API authorization scoped by user-owned financial resources: transactions, categories, budgets, goals, assets, portfolios, dividends, and reports
- Tests covering authorization boundaries for IDOR/BOLA-style scenarios
- GitHub Actions checks for tests, builds, secret scanning, SAST, vulnerability scanning, and npm audit
- Investment workflow with canonical assets, append-only portfolio events, automatic quotes, dividends, and monthly reporting

## Tech Stack

**Frontend**
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Query
- Recharts

**Backend**
- NestJS + TypeScript
- Prisma ORM
- JWT Auth (access + refresh tokens)
- Argon2id password hashing + pepper
- OpenAPI (Swagger)

**Database**
- Postgres (Supabase)

## Architecture

```
React (SPA) -> NestJS API -> Postgres (Supabase)
```

The frontend never talks to the database directly. All operations go through the API, which enforces auth, validation, and business rules.

## Monorepo Layout

```
apps/
  web/   # Frontend (React + Vite)
  api/   # Backend (NestJS + Prisma)
```

## Getting Started (Local)

```bash
npm install

# Frontend
npm run dev:web

# Backend
npm run dev:api
```

### Environment Variables

**apps/web/.env**
```
VITE_API_URL=http://localhost:4000/api/v1
```

**apps/api/.env**
```
DATABASE_URL=postgresql://...
AUTH_JWT_SECRET=...
AUTH_JWT_ISSUER=financebuddy
AUTH_JWT_AUD=financebuddy
PASSWORD_PEPPER=...
ARGON2_MEMORY_KIB=19456
ARGON2_TIME_COST=2
ARGON2_PARALLELISM=1
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=30
CORS_ORIGIN=http://localhost:8080
TRUST_PROXY=false
PORT=4000
REQUEST_BODY_LIMIT=100kb

# Optional
ENABLE_SWAGGER=true
COOKIE_DOMAIN=
COOKIE_SAMESITE=lax
```

## Database Setup

This project uses Supabase as a managed Postgres database. Run the SQL migrations in order:

```
supabase/migrations/
```

Use the Supabase SQL editor to execute the files in timestamp order.

## API Docs

- Swagger (local): `http://localhost:4000/docs`
- Health check: `http://localhost:4000/api/v1/health`

> Swagger is enabled in development by default and intentionally disabled in production.

## Security

FinanceBuddy includes security controls focused on authentication, authorization, and handling user-owned financial data through the API.

### Implemented security controls

- Argon2id password hashing with a server-side pepper
- Short-lived JWT access tokens
- Rotating refresh tokens stored as hashes
- HttpOnly refresh cookies
- CSRF protection on cookie-authenticated refresh/logout endpoints
- Global rate limiting, with tighter limits on auth and heavy report/quote endpoints
- DTO request validation with NestJS `ValidationPipe`
- Authorization checks for user-owned financial resources
- Anti-enumeration behavior for cross-user resource access
- Security event logging for authentication and refresh-token activity

### Automated checks

- CI for API tests, web tests, lint, and builds
- Secret scanning with Gitleaks
- SAST with Semgrep OWASP rules
- Filesystem vulnerability scanning with Trivy
- Blocking dependency checks with `npm audit --audit-level=high`

### Main security scenario

A user must never be able to access another user's financial data by modifying IDs in API requests. FinanceBuddy tests this against real resources such as transactions, budgets, goals, assets, portfolios, and monthly portfolio reports.

See [`SECURITY.md`](./SECURITY.md) for security notes,
[`SECURITY_STATUS.md`](./SECURITY_STATUS.md) for implementation status, and
[`docs/security/SECURITY_REQUIREMENTS.md`](./docs/security/SECURITY_REQUIREMENTS.md)
for the current requirements checklist.

This is a portfolio project with common web security controls. It is not audited financial software and should not be treated as banking infrastructure without further review.

## Tests

```bash
npm run test:web
npm run test:api
npm run lint
npm run build:api
npm run build:web
```

## Deployment (Overview)

- **Frontend**: Vercel
- **Backend**: Koyeb or Render
- **Database**: Supabase Postgres

Set `VITE_API_URL` on the frontend to the API base URL (e.g. `https://your-api.app/api/v1`).
