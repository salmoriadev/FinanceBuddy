-- Persist security-relevant events for AppSec review and incident analysis.

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  metadata JSONB,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_created
  ON public.security_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_type_created
  ON public.security_events(type, created_at DESC);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.security_events FROM anon;
REVOKE ALL ON TABLE public.security_events FROM authenticated;

DROP POLICY IF EXISTS "No direct client access to security events" ON public.security_events;
CREATE POLICY "No direct client access to security events" ON public.security_events
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
