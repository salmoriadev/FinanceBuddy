CREATE TYPE public.asset_class AS ENUM (
  'stock',
  'fii',
  'etf',
  'bdr',
  'fixed_income',
  'crypto',
  'custom'
);

CREATE TYPE public.quote_status AS ENUM (
  'current',
  'stale',
  'manual',
  'estimated',
  'incomplete'
);

CREATE TYPE public.data_source_type AS ENUM (
  'manual',
  'mock',
  'external',
  'legacy_manual'
);

CREATE TYPE public.portfolio_transaction_type AS ENUM (
  'buy',
  'sell',
  'dividend',
  'fee',
  'manual_adjustment',
  'opening_balance'
);

CREATE TABLE public.data_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  source_type public.data_source_type NOT NULL DEFAULT 'manual',
  status public.quote_status NOT NULL DEFAULT 'current',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT data_providers_user_name_key UNIQUE (user_id, name)
);

CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  class public.asset_class NOT NULL DEFAULT 'custom',
  sector TEXT,
  currency TEXT NOT NULL DEFAULT 'BRL',
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  source_type public.data_source_type NOT NULL DEFAULT 'manual',
  status public.quote_status NOT NULL DEFAULT 'manual',
  observed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT assets_user_ticker_key UNIQUE (user_id, ticker)
);

CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_id UUID NOT NULL REFERENCES public.assets(id),
  provider_id UUID REFERENCES public.data_providers(id),
  price DECIMAL(20, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  source TEXT NOT NULL DEFAULT 'manual',
  source_type public.data_source_type NOT NULL DEFAULT 'manual',
  status public.quote_status NOT NULL DEFAULT 'manual',
  quoted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.portfolio_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id),
  asset_id UUID NOT NULL REFERENCES public.assets(id),
  type public.portfolio_transaction_type NOT NULL,
  quantity DECIMAL(24, 10),
  unit_price DECIMAL(20, 8),
  gross_amount DECIMAL(20, 8),
  fees DECIMAL(20, 8) NOT NULL DEFAULT 0,
  taxes DECIMAL(20, 8) NOT NULL DEFAULT 0,
  total_amount DECIMAL(20, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  occurred_at DATE NOT NULL,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  source_type public.data_source_type NOT NULL DEFAULT 'manual',
  status public.quote_status NOT NULL DEFAULT 'manual',
  legacy_investment_id UUID UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.position_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id),
  asset_id UUID NOT NULL REFERENCES public.assets(id),
  quantity DECIMAL(24, 10) NOT NULL,
  average_price DECIMAL(20, 8) NOT NULL,
  cost_basis DECIMAL(20, 8) NOT NULL,
  current_value DECIMAL(20, 8) NOT NULL,
  dividends DECIMAL(20, 8) NOT NULL DEFAULT 0,
  unrealized_gain DECIMAL(20, 8) NOT NULL,
  roi DECIMAL(20, 8) NOT NULL DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.calculation_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id),
  scope TEXT NOT NULL,
  formula TEXT NOT NULL,
  inputs JSONB NOT NULL,
  result JSONB NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_user_class ON public.assets(user_id, class);
CREATE INDEX idx_quotes_user_asset_quoted ON public.quotes(user_id, asset_id, quoted_at);
CREATE INDEX idx_portfolios_user ON public.portfolios(user_id);
CREATE INDEX idx_portfolio_transactions_user_portfolio_date ON public.portfolio_transactions(user_id, portfolio_id, occurred_at);
CREATE INDEX idx_portfolio_transactions_user_asset ON public.portfolio_transactions(user_id, asset_id);
CREATE INDEX idx_position_snapshots_user_portfolio_time ON public.position_snapshots(user_id, portfolio_id, calculated_at);
CREATE INDEX idx_calculation_audits_user_portfolio_time ON public.calculation_audits(user_id, portfolio_id, calculated_at);

ALTER TABLE public.data_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their data providers" ON public.data_providers
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can create their data providers" ON public.data_providers
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can view their assets" ON public.assets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their assets" ON public.assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their assets" ON public.assets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their quotes" ON public.quotes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their quotes" ON public.quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their portfolios" ON public.portfolios
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their portfolios" ON public.portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their portfolios" ON public.portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their portfolio transactions" ON public.portfolio_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their portfolio transactions" ON public.portfolio_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their position snapshots" ON public.position_snapshots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their position snapshots" ON public.position_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their calculation audits" ON public.calculation_audits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their calculation audits" ON public.calculation_audits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
