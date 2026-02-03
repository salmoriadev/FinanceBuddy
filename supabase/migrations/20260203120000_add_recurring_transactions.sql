ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID
    REFERENCES public.transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_recurrence_parent
  ON public.transactions(recurrence_parent_id);
