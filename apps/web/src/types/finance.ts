export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  type: TransactionType;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  is_recurring: boolean;
  created_at: string;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  category?: Category;
  spent?: number;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  color: string;
  created_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  asset_symbol: string | null;
  quantity: number | null;
  average_price: number | null;
  invested_amount: number;
  current_value: number;
  market_price: number | null;
  market_value: number | null;
  quote_provider: string | null;
  quote_currency: string | null;
  quote_updated_at: string | null;
  start_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface InvestmentAssetSearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  currency: string;
  provider: string;
  logoUrl?: string | null;
  price?: number | null;
  quotedAt?: string | null;
}

export type FixedIncomeIndexer = "fixed" | "cdi" | "ipca";

export type AssetClass =
  | "stock"
  | "fii"
  | "etf"
  | "bdr"
  | "fixed_income"
  | "crypto"
  | "custom";

export type QuoteStatus =
  | "current"
  | "stale"
  | "manual"
  | "estimated"
  | "incomplete";

export type DataSourceType = "manual" | "mock" | "external" | "legacy_manual";

export type PortfolioTransactionType =
  | "buy"
  | "sell"
  | "dividend"
  | "fee"
  | "manual_adjustment"
  | "opening_balance";

export type DividendEventStatus =
  | "announced"
  | "confirmed"
  | "received"
  | "cancelled";

export type DividendReceiptStatus = "pending" | "received" | "cancelled";

export interface Quote {
  id: string;
  user_id: string;
  asset_id: string;
  price: number;
  currency: string;
  source: string;
  source_type: DataSourceType;
  status: QuoteStatus;
  quoted_at: string;
  created_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  ticker: string;
  name: string;
  class: AssetClass;
  sector: string | null;
  currency: string;
  notes: string | null;
  fixed_income_indexer: FixedIncomeIndexer | null;
  fixed_income_rate: number | null;
  fixed_income_base_date: string | null;
  source: string;
  source_type: DataSourceType;
  status: QuoteStatus;
  observed_at: string | null;
  created_at: string;
  updated_at: string;
  latest_quote: Quote | null;
}

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioPosition {
  asset: Asset;
  quantity: number;
  averagePrice: number;
  costBasis: number;
  currentValue: number;
  dividends: number;
  unrealizedGain: number;
  realizedGain: number;
  roi: number;
  latestQuote: Quote | null;
  audit: {
    formula: string;
    eventCount: number;
    quoteSource: string | null;
    quoteStatus: QuoteStatus;
    quotedAt: string | null;
  };
}

export interface PortfolioDividendReceipt {
  id: string;
  user_id: string;
  portfolio_id: string;
  asset_id: string;
  dividend_event_id: string | null;
  status: DividendReceiptStatus;
  quantity: number | null;
  amount_per_share: number;
  gross_amount: number | null;
  taxes: number;
  total_amount: number | null;
  currency: string;
  ex_date: string | null;
  payment_date: string;
  received_at: string | null;
  transaction_id: string | null;
  notes: string | null;
  source: string;
  source_type: DataSourceType;
  created_at: string;
  updated_at: string;
  asset: Asset;
}

export interface PortfolioMonthlyReport {
  portfolioId: string;
  month: string;
  periodStart: string;
  periodEnd: string;
  contributions: number;
  sales: number;
  dividendsReceived: number;
  estimatedCapitalGain: number;
  portfolioValue: number;
  transactionCount: number;
  pendingData: {
    staleQuotes: number;
    missingQuotes: number;
    pendingDividends: number;
    hasPendingData: boolean;
  };
  dividends: Array<{
    id: string;
    status: DividendReceiptStatus;
    ticker: string;
    paymentDate: string;
    totalAmount: number | null;
  }>;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export interface CategorySpending {
  name: string;
  value: number;
  color: string;
}

export interface ReportSummary {
  year: number;
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
}

export interface ReportMonthlyData {
  month: number;
  income: number;
  expense: number;
  balance: number;
}

export interface ReportCategorySpending {
  name: string;
  type: TransactionType;
  color: string;
  value: number;
}

export interface ReportCurrentMonthCategory extends ReportCategorySpending {
  categoryId: string;
}

export interface ReportCurrentMonthComparison {
  currentExpense: number;
  lastExpense: number;
  variation: number | null;
  hasVariationBaseline: boolean;
}

export interface ReportAnalytics {
  year: number;
  summary: ReportSummary;
  monthly: ReportMonthlyData[];
  categories: ReportCategorySpending[];
  currentMonthComparison: ReportCurrentMonthComparison;
  currentMonthCategories: ReportCurrentMonthCategory[];
  availableYears: number[];
}
