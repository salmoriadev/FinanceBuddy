# Security Report — FinanceBuddy

Date: 2026-02-02

## Scope
- Frontend: React/Vite app (`apps/web`)
- API: NestJS + Prisma (`apps/api`)
- Database: Supabase Postgres (migrations em `supabase/migrations`)

## Executive Summary
O sistema passou a usar **auth própria na API** (JWT + refresh token) com **hash Argon2id** e validações de senha. O frontend não acessa mais o banco diretamente. A API aplica validação e escopo por usuário e o banco mantém constraints e políticas de segurança.

## Changes Implemented (Security Hardening)
1. **Auth própria com hash lento (Argon2id + pepper opcional)**
   - Senha nunca é armazenada em texto; tokens de refresh são hashados.
   - Arquivos: `apps/api/src/modules/auth/*`

2. **JWT guard com validação de issuer/audience**
   - Tokens válidos obrigatórios em todas as rotas privadas.
   - Arquivo: `apps/api/src/common/guards/jwt-auth.guard.ts`

3. **Rate limiting global**
   - Protege endpoints de brute force.
   - Arquivo: `apps/api/src/app.module.ts`

4. **Checagem de ownership em transações/orçamentos**
   - Categoria só pode ser usada se pertencer ao usuário.
   - Arquivos: `apps/api/src/modules/transactions/*`, `apps/api/src/modules/budgets/*`

5. **Migrations de auth**
   - Novas tabelas `users` e `refresh_tokens` com índices.
   - Arquivo: `supabase/migrations/20260202120000_add_auth_tables.sql`

6. **CORS restrito por allowlist**
   - Em produção, bloqueia origens não configuradas.
   - Arquivo: `apps/api/src/main.ts`

7. **Proxy-aware IP + cookies**
   - `trust proxy` habilitado para logs e cookies seguros atrás de proxies.
   - Arquivo: `apps/api/src/main.ts`

8. **Erro interno sem detalhes em produção**
   - Evita vazamento de detalhes de exceções 5xx.
   - Arquivo: `apps/api/src/common/filters/http-exception.filter.ts`

## Findings & Recommendations

### High
- **Sem MFA habilitado**
  - Recomendação: implementar MFA TOTP na API e UI.

### Medium
- **Tokens em storage do navegador (access token)**
  - Access token fica em localStorage por conveniência.
  - Recomendação: manter access token em memória e usar refresh via cookie httpOnly.

### Low
- **Agregações no client**
  - Relatórios ainda são calculados no frontend.
  - Recomendação: mover agregações para endpoints dedicados na API.

## Cryptography & Data Protection
- Hash de senha: **Argon2id** com parâmetros configuráveis.
- Refresh token: hash SHA-256 armazenado (token nunca persistido em claro).
- Supabase Postgres mantém criptografia em repouso.

## Required Actions to Apply Hardening
Execute as migrations (ordem):
1. `supabase/migrations/20260130090000_base_schema.sql`
2. `supabase/migrations/20260130231500_add_investments.sql`
3. `supabase/migrations/20260130235500_security_hardening.sql`
4. `supabase/migrations/20260202120000_add_auth_tables.sql`
