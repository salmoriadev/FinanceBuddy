/**
 * This file implements Finance behavior for the shared types layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
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
  availableYears: number[];
}
