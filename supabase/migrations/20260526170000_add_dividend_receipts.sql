CREATE TYPE public.dividend_event_status AS ENUM (
  'announced',
  'confirmed',
  'received',
  'cancelled'
);

CREATE TYPE public.dividend_receipt_status AS ENUM (
  'pending',
  'received',
  'cancelled'
);

CREATE TABLE public.dividend_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_id UUID NOT NULL REFERENCES public.assets(id),
  source TEXT NOT NULL DEFAULT 'manual',
  source_type public.data_source_type NOT NULL DEFAULT 'manual',
  status public.dividend_event_status NOT NULL DEFAULT 'announced',
  ex_date DATE,
  payment_date DATE NOT NULL,
  amount_per_share DECIMAL(20, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.portfolio_dividend_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id),
  asset_id UUID NOT NULL REFERENCES public.assets(id),
  dividend_event_id UUID REFERENCES public.dividend_events(id),
  status public.dividend_receipt_status NOT NULL DEFAULT 'pending',
  quantity DECIMAL(24, 10),
  amount_per_share DECIMAL(20, 8) NOT NULL,
  gross_amount DECIMAL(20, 8),
  taxes DECIMAL(20, 8) NOT NULL DEFAULT 0,
  total_amount DECIMAL(20, 8),
  currency TEXT NOT NULL DEFAULT 'BRL',
  ex_date DATE,
  payment_date DATE NOT NULL,
  received_at DATE,
  transaction_id UUID,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  source_type public.data_source_type NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_dividend_events_user_asset_payment
  ON public.dividend_events(user_id, asset_id, payment_date);
CREATE INDEX idx_dividend_receipts_user_portfolio_payment
  ON public.portfolio_dividend_receipts(user_id, portfolio_id, payment_date);
CREATE INDEX idx_dividend_receipts_user_asset
  ON public.portfolio_dividend_receipts(user_id, asset_id);

ALTER TABLE public.dividend_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_dividend_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their dividend events" ON public.dividend_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their dividend events" ON public.dividend_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their dividend events" ON public.dividend_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their dividend receipts" ON public.portfolio_dividend_receipts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their dividend receipts" ON public.portfolio_dividend_receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their dividend receipts" ON public.portfolio_dividend_receipts
  FOR UPDATE USING (auth.uid() = user_id);
