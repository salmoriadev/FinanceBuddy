import {
  Asset,
  AssetClass,
  Budget,
  Category,
  DataSourceType,
  FixedIncomeIndexer,
  Investment,
  Portfolio,
  PortfolioDividendReceipt,
  PortfolioMonthlyReport,
  PortfolioPosition,
  Quote,
  QuoteStatus,
  SavingsGoal,
  Transaction,
  TransactionType,
} from "@/types/finance";

export type ApiCategory = {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  type: TransactionType;
  createdAt: string;
};

export type ApiTransaction = {
  id: string;
  userId: string;
  categoryId: string | null;
  description: string;
  amount: number | string;
  type: TransactionType;
  date: string;
  isRecurring: boolean;
  createdAt: string;
  category?: ApiCategory | null;
};

export type ApiBudget = {
  id: string;
  userId: string;
  categoryId: string;
  amount: number | string;
  month: number;
  year: number;
  createdAt: string;
  category?: ApiCategory | null;
};

export type ApiSavingsGoal = {
  id: string;
  userId: string;
  name: string;
  targetAmount: number | string;
  currentAmount: number | string;
  targetDate: string | null;
  color: string;
  createdAt: string;
};

export type ApiInvestment = {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  assetSymbol: string | null;
  quantity: number | string | null;
  averagePrice: number | string | null;
  investedAmount: number | string;
  currentValue: number | string;
  marketPrice: number | string | null;
  marketValue: number | string | null;
  quoteProvider: string | null;
  quoteCurrency: string | null;
  quoteUpdatedAt: string | null;
  startDate: string | null;
  notes: string | null;
  createdAt: string;
};

export type ApiQuote = {
  id: string;
  userId: string;
  assetId: string;
  price: number | string;
  currency: string;
  source: string;
  sourceType: DataSourceType;
  status: QuoteStatus;
  quotedAt: string;
  createdAt: string;
};

export type ApiAsset = {
  id: string;
  userId: string;
  ticker: string;
  name: string;
  class: AssetClass;
  sector: string | null;
  currency: string;
  notes: string | null;
  fixedIncomeIndexer: FixedIncomeIndexer | null;
  fixedIncomeRate: number | string | null;
  fixedIncomeBaseDate: string | null;
  source: string;
  sourceType: DataSourceType;
  status: QuoteStatus;
  observedAt: string | null;
  createdAt: string;
  updatedAt: string;
  quotes?: ApiQuote[];
};

export type ApiPortfolio = {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiPortfolioPosition = {
  asset: ApiAsset;
  quantity: number;
  averagePrice: number;
  costBasis: number;
  currentValue: number;
  dividends: number;
  unrealizedGain: number;
  realizedGain: number;
  roi: number;
  latestQuote: ApiQuote | null;
  audit: PortfolioPosition["audit"];
};

export type ApiPortfolioDividendReceipt = {
  id: string;
  userId: string;
  portfolioId: string;
  assetId: string;
  dividendEventId: string | null;
  status: PortfolioDividendReceipt["status"];
  quantity: number | string | null;
  amountPerShare: number | string;
  grossAmount: number | string | null;
  taxes: number | string;
  totalAmount: number | string | null;
  currency: string;
  exDate: string | null;
  paymentDate: string;
  receivedAt: string | null;
  transactionId: string | null;
  notes: string | null;
  source: string;
  sourceType: DataSourceType;
  createdAt: string;
  updatedAt: string;
  asset: ApiAsset;
};

export type ApiPortfolioMonthlyReport = PortfolioMonthlyReport;

export const mapCategory = (api: ApiCategory): Category => ({
  id: api.id,
  user_id: api.userId,
  name: api.name,
  color: api.color,
  icon: api.icon,
  type: api.type,
  created_at: api.createdAt,
});

export const mapTransaction = (api: ApiTransaction): Transaction => ({
  id: api.id,
  user_id: api.userId,
  category_id: api.categoryId,
  description: api.description,
  amount: Number(api.amount),
  type: api.type,
  date: api.date,
  is_recurring: api.isRecurring,
  created_at: api.createdAt,
  category: api.category ? mapCategory(api.category) : undefined,
});

export const mapBudget = (api: ApiBudget): Budget => ({
  id: api.id,
  user_id: api.userId,
  category_id: api.categoryId,
  amount: Number(api.amount),
  month: api.month,
  year: api.year,
  created_at: api.createdAt,
  category: api.category ? mapCategory(api.category) : undefined,
});

export const mapGoal = (api: ApiSavingsGoal): SavingsGoal => ({
  id: api.id,
  user_id: api.userId,
  name: api.name,
  target_amount: Number(api.targetAmount),
  current_amount: Number(api.currentAmount),
  target_date: api.targetDate,
  color: api.color,
  created_at: api.createdAt,
});

export const mapInvestment = (api: ApiInvestment): Investment => ({
  id: api.id,
  user_id: api.userId,
  name: api.name,
  category: api.category,
  asset_symbol: api.assetSymbol,
  quantity: api.quantity === null ? null : Number(api.quantity),
  average_price: api.averagePrice === null ? null : Number(api.averagePrice),
  invested_amount: Number(api.investedAmount),
  current_value: Number(api.currentValue),
  market_price: api.marketPrice === null ? null : Number(api.marketPrice),
  market_value: api.marketValue === null ? null : Number(api.marketValue),
  quote_provider: api.quoteProvider,
  quote_currency: api.quoteCurrency,
  quote_updated_at: api.quoteUpdatedAt,
  start_date: api.startDate,
  notes: api.notes,
  created_at: api.createdAt,
});

export const mapQuote = (api: ApiQuote): Quote => ({
  id: api.id,
  user_id: api.userId,
  asset_id: api.assetId,
  price: Number(api.price),
  currency: api.currency,
  source: api.source,
  source_type: api.sourceType,
  status: api.status,
  quoted_at: api.quotedAt,
  created_at: api.createdAt,
});

export const mapAsset = (api: ApiAsset): Asset => ({
  id: api.id,
  user_id: api.userId,
  ticker: api.ticker,
  name: api.name,
  class: api.class,
  sector: api.sector,
  currency: api.currency,
  notes: api.notes,
  fixed_income_indexer: api.fixedIncomeIndexer,
  fixed_income_rate:
    api.fixedIncomeRate === null ? null : Number(api.fixedIncomeRate),
  fixed_income_base_date: api.fixedIncomeBaseDate,
  source: api.source,
  source_type: api.sourceType,
  status: api.status,
  observed_at: api.observedAt,
  created_at: api.createdAt,
  updated_at: api.updatedAt,
  latest_quote: api.quotes?.[0] ? mapQuote(api.quotes[0]) : null,
});

export const mapPortfolio = (api: ApiPortfolio): Portfolio => ({
  id: api.id,
  user_id: api.userId,
  name: api.name,
  is_default: api.isDefault,
  created_at: api.createdAt,
  updated_at: api.updatedAt,
});

export const mapPortfolioPosition = (
  api: ApiPortfolioPosition,
): PortfolioPosition => ({
  asset: mapAsset(api.asset),
  quantity: api.quantity,
  averagePrice: api.averagePrice,
  costBasis: api.costBasis,
  currentValue: api.currentValue,
  dividends: api.dividends,
  unrealizedGain: api.unrealizedGain,
  realizedGain: api.realizedGain,
  roi: api.roi,
  latestQuote: api.latestQuote ? mapQuote(api.latestQuote) : null,
  audit: api.audit,
});

export const mapPortfolioDividendReceipt = (
  api: ApiPortfolioDividendReceipt,
): PortfolioDividendReceipt => ({
  id: api.id,
  user_id: api.userId,
  portfolio_id: api.portfolioId,
  asset_id: api.assetId,
  dividend_event_id: api.dividendEventId,
  status: api.status,
  quantity: api.quantity === null ? null : Number(api.quantity),
  amount_per_share: Number(api.amountPerShare),
  gross_amount: api.grossAmount === null ? null : Number(api.grossAmount),
  taxes: Number(api.taxes),
  total_amount: api.totalAmount === null ? null : Number(api.totalAmount),
  currency: api.currency,
  ex_date: api.exDate,
  payment_date: api.paymentDate,
  received_at: api.receivedAt,
  transaction_id: api.transactionId,
  notes: api.notes,
  source: api.source,
  source_type: api.sourceType,
  created_at: api.createdAt,
  updated_at: api.updatedAt,
  asset: mapAsset(api.asset),
});
