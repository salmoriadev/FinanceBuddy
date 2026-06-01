-- Harden API-managed auth tables.
--
-- FinanceBuddy authenticates through the NestJS API, not direct Supabase client
-- access. These tables contain password hashes, refresh token hashes, and
-- device metadata, so browser-facing roles should not read or mutate them.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.users FROM anon;
REVOKE ALL ON TABLE public.users FROM authenticated;
REVOKE ALL ON TABLE public.refresh_tokens FROM anon;
REVOKE ALL ON TABLE public.refresh_tokens FROM authenticated;

DROP POLICY IF EXISTS "No direct client access to users" ON public.users;
CREATE POLICY "No direct client access to users" ON public.users
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "No direct client access to refresh tokens" ON public.refresh_tokens;
CREATE POLICY "No direct client access to refresh tokens" ON public.refresh_tokens
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
