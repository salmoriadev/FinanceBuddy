# Security Report — FinanceBuddy

Date: 2026-01-30

## Scope
- Frontend: React/Vite app (`src/`)
- Data access: Supabase client/hooks (`src/hooks/*`, `src/integrations/supabase/*`)
- Database: Supabase migrations (`supabase/migrations/*`)

## Executive Summary
The application is well-structured and uses Supabase with Row Level Security (RLS). I implemented additional safeguards at the application layer (user-bound mutations, stronger input validation), and added database hardening (constraints + stricter policies). I also restored a base schema migration to ensure new environments come up correctly.

## Changes Implemented (Security Hardening)
1. **Base schema migration added**
   - Ensures all core tables + RLS exist on new environments.
   - File: `supabase/migrations/20260130090000_base_schema.sql`

2. **Defense-in-depth filters on mutations**
   - Update/Delete operations now require `user_id` equality in addition to `id` filters.
   - Files updated:
     - `src/hooks/useTransactions.tsx`
     - `src/hooks/useBudgets.tsx`
     - `src/hooks/useSavingsGoals.tsx`
     - `src/hooks/useInvestments.tsx`

3. **Input validation for monetary fields**
   - Amount fields validate non-negative/positive values using a shared parser.
   - Files updated:
     - `src/lib/number.ts`
     - `src/components/transactions/TransactionForm.tsx`
     - `src/pages/Budgets.tsx`
     - `src/pages/Goals.tsx`
     - `src/pages/Investments.tsx`

4. **Stricter DB constraints + RLS policies**
   - Added numeric CHECK constraints and stricter policies (category ownership checks, WITH CHECK on updates).
   - File: `supabase/migrations/20260130235500_security_hardening.sql`

5. **Secret management for production**
   - Moved Supabase keys to `.env` (git-ignored) and added `.env.example`.
   - Added a runtime guard to fail fast if env vars are missing.
   - Files updated:
     - `.gitignore`
     - `.env.example`
     - `src/integrations/supabase/client.ts`

## Findings & Recommendations

### High
- **RLS reliance without application-level guardrails (fixed)**
  - Previously, update/delete mutations only filtered by `id`.
  - Fix applied: `user_id` filter added to every update/delete mutation.

### Medium
- **Category ownership not enforced in DB (fixed)**
  - A user could link transactions/budgets to another user’s category if RLS didn’t check it.
  - Fix added in migration: category ownership checks on INSERT/UPDATE policies.

- **Lack of numeric constraints in DB (fixed)**
  - DB allowed negative amounts and other invalid values.
  - Fix added: CHECK constraints in hardening migration.

- **Token storage in localStorage**
  - Supabase auth stores tokens in localStorage; increases exposure in XSS scenarios.
  - Recommendation: deploy with a strict Content Security Policy (CSP) and avoid unsafe inline scripts.

### Low
- **Client-side aggregates**
  - Reports compute aggregates in the client by scanning all rows.
  - Recommendation: add server-side views/functions for aggregation to scale beyond a few thousand rows.

- **Formatting logic spread across pages**
  - Currency/date formatting is repeated.
  - Recommendation: centralize format helpers for consistency and maintainability. (Work in progress; currency is already centralized.)

## Cryptography & Data Protection
- Supabase provides encryption at rest by default.
- For highly sensitive notes or fields, consider client-side encryption or Supabase Vault/pgcrypto.
- Ensure backups are enabled in Supabase for data durability.

## Required Actions to Apply Hardening
Run these migrations in Supabase (in order):
1. `supabase/migrations/20260130090000_base_schema.sql`
2. `supabase/migrations/20260130231500_add_investments.sql`
3. `supabase/migrations/20260130235500_security_hardening.sql`

If you need, I can provide a single merged SQL file to run once.
