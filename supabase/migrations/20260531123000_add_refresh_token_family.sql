-- Track refresh-token families so token reuse can revoke the compromised
-- session chain instead of relying only on global user-token revocation.

ALTER TABLE public.refresh_tokens
  ADD COLUMN IF NOT EXISTS family_id UUID;

ALTER TABLE public.refresh_tokens
  ADD COLUMN IF NOT EXISTS replaced_by_token_id UUID
    REFERENCES public.refresh_tokens(id) ON DELETE SET NULL;

UPDATE public.refresh_tokens
SET family_id = id
WHERE family_id IS NULL;

ALTER TABLE public.refresh_tokens
  ALTER COLUMN family_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family
  ON public.refresh_tokens(family_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_replaced_by
  ON public.refresh_tokens(replaced_by_token_id);
