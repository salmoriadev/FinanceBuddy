/**
 * This file implements Api Mappers behavior for the frontend utility layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import {
  Budget,
  Category,
  Investment,
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
