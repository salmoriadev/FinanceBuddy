# FinanceBuddy

Arquitetura em 3 camadas com foco em performance, segurança e portfólio:

```
React (SPA) -> API NestJS -> Postgres (Supabase)
                  ^
                  | JWT (Supabase Auth)
```

## Estrutura do monorepo

```
apps/
  web/   # Frontend (React + Vite)
  api/   # Backend (NestJS + Prisma)
```

## Tecnologias

**Web**
- React + TypeScript + Vite
- Tailwind + shadcn-ui
- React Query

**API**
- NestJS + TypeScript
- Prisma ORM
- JWT guard (Auth própria)
- Swagger/OpenAPI
- Jest + Supertest

## Como rodar (local)

```bash
npm install

# Frontend
npm run dev:web

# API
npm run dev:api
```

### Variaveis de ambiente

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
```

> O backend usa o Postgres do seu Supabase. Rode as migrations SQL em `supabase/migrations/`.

## API Docs

- Swagger: `http://localhost:4000/docs`
- Health: `http://localhost:4000/api/v1/health`

## Observacao

O backend implementa **auth propria** (JWT + refresh token). O Supabase e usado apenas como **Postgres** gerenciado.

## Testes

```bash
npm run test:web
npm run test:api
```
