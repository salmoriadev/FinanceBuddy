alter table public.investments
  add column if not exists asset_symbol text,
  add column if not exists quantity numeric(18, 6),
  add column if not exists average_price numeric(12, 2),
  add column if not exists market_price numeric(12, 2),
  add column if not exists market_value numeric(12, 2),
  add column if not exists quote_provider text,
  add column if not exists quote_currency text,
  add column if not exists quote_updated_at timestamptz;

create index if not exists idx_investments_user_asset_symbol
  on public.investments (user_id, asset_symbol);
