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
  invested_amount: number;
  current_value: number;
  start_date: string | null;
  notes: string | null;
  created_at: string;
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
