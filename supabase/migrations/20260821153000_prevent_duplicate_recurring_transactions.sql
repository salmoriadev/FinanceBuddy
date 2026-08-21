-- Recurring materialization can run concurrently in separate API instances.
-- Keep the earliest copy of any already-duplicated occurrence, then make the
-- recurrence identity enforceable by PostgreSQL for all future writers.

WITH ranked_occurrences AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, recurrence_parent_id, date
      ORDER BY created_at ASC, id ASC
    ) AS occurrence_rank
  FROM public.transactions
  WHERE recurrence_parent_id IS NOT NULL
)
DELETE FROM public.transactions AS target
USING ranked_occurrences AS duplicate
WHERE target.id = duplicate.id
  AND duplicate.occurrence_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_user_recurrence_parent_date_key
  ON public.transactions(user_id, recurrence_parent_id, date);
