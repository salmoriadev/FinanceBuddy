# FinanceBuddy

FinanceBuddy is a premium, modern personal finance manager focused on clarity and speed. It combines a polished React UI with a secure NestJS API and a managed Postgres database.

## Highlights

- **Dashboard** with monthly balance, income vs. expenses, savings rate, and visual charts
- **Transactions** with categories, filters, recurring income/expense automation
- **Budgets & Goals** with progress bars and quick updates
- **Investments** tracking (invested vs. current value, returns)
- **Reports** with comparisons, monthly evolution, and category breakdowns
- **Account settings** for language and currency

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
PORT=4000

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

> Swagger is enabled in development by default. In production, set `ENABLE_SWAGGER=true` to expose it.

## Security Notes

- All API routes are protected with JWT auth
- Input validation is enforced via DTOs + ValidationPipe
- Passwords use **Argon2id** with a server-side **pepper**
- Refresh tokens are stored as **hashes** and sent via **HttpOnly** cookies
- Global rate limiting is enabled, with tighter limits on auth endpoints

## Tests

```bash
npm run test:web
npm run test:api
```

## Deployment (Overview)

- **Frontend**: Vercel
- **Backend**: Koyeb or Render
- **Database**: Supabase Postgres

Set `VITE_API_URL` on the frontend to the API base URL (e.g. `https://your-api.app/api/v1`).

---

If you want a production checklist or infra hardening (CSRF, WAF, audit logs), open an issue or message me.
