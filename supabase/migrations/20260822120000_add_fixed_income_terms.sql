CREATE TYPE public.fixed_income_indexer AS ENUM ('fixed', 'cdi', 'ipca');

ALTER TABLE public.assets
  ADD COLUMN fixed_income_indexer public.fixed_income_indexer,
  ADD COLUMN fixed_income_rate numeric(9, 4),
  ADD COLUMN fixed_income_base_date date;

ALTER TABLE public.assets
  ADD CONSTRAINT assets_fixed_income_rate_bounds_check
  CHECK (fixed_income_rate IS NULL OR (fixed_income_rate >= 0 AND fixed_income_rate <= 1000)),
  ADD CONSTRAINT assets_fixed_income_terms_check
  CHECK (
    class <> 'fixed_income'
    OR (
      fixed_income_indexer IS NULL
      AND fixed_income_rate IS NULL
      AND fixed_income_base_date IS NULL
    )
    OR (
      fixed_income_indexer IS NOT NULL
      AND fixed_income_rate IS NOT NULL
    )
  );

COMMENT ON COLUMN public.assets.fixed_income_indexer IS
  'Yield model: fixed annual rate, percentage of CDI, or IPCA plus an annual spread.';
COMMENT ON COLUMN public.assets.fixed_income_rate IS
  'For fixed/IPCA: annual percentage rate. For CDI: percentage of the CDI benchmark.';
COMMENT ON COLUMN public.assets.fixed_income_base_date IS
  'Date on which the fixed-income unit index equals 1. Set by the first portfolio event.';
