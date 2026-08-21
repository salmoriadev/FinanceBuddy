import { fireEvent, render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Index from "@/pages/Index";
import type { ReportAnalytics, Transaction } from "@/types/finance";

const { mockedUseReportAnalytics, mockedUseTransactions } = vi.hoisted(() => ({
  mockedUseReportAnalytics: vi.fn(),
  mockedUseTransactions: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "user@example.com" },
    loading: false,
  }),
}));
vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: mockedUseTransactions,
}));
vi.mock("@/hooks/useReports", () => ({
  useReportAnalytics: mockedUseReportAnalytics,
}));
vi.mock("@/hooks/useBudgets", () => ({
  useBudgets: () => ({
    budgets: [
      {
        id: "budget-1",
        category_id: "category-food",
        amount: 2_000,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    ],
  }),
}));
vi.mock("@/hooks/useSavingsGoals", () => ({
  useSavingsGoals: () => ({ goals: [] }),
}));
vi.mock("@/hooks/useFormatter", () => ({
  useFormatter: () => ({
    formatCurrency: (value: number) => `currency:${value}`,
    formatPercent: (value: number) => `percent:${value}`,
    monthsShort: Array.from({ length: 12 }, (_, index) => `month-${index + 1}`),
  }),
}));
vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("@/hooks/useCategoryLabels", () => ({
  useCategoryLabels: () => ({ labelFor: (name: string) => name }),
}));
vi.mock("@/components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/dashboard/StatCard", () => ({
  StatCard: ({ title, value }: { title: string; value: string }) => (
    <div>{`${title}:${value}`}</div>
  ),
}));
vi.mock("@/components/dashboard/ExpenseChart", () => ({
  ExpenseChart: ({ data }: { data: Array<{ name: string; value: number }> }) => (
    <div data-testid="expense-data">
      {data.map((item) => `${item.name}:${item.value}`).join(",")}
    </div>
  ),
}));
vi.mock("@/components/dashboard/MonthlyChart", () => ({
  MonthlyChart: ({ data }: { data: Array<{ month: string; expense: number }> }) => (
    <div data-testid="monthly-data">
      {data.map((item) => `${item.month}:${item.expense}`).join(",")}
    </div>
  ),
}));
vi.mock("@/components/dashboard/BudgetProgress", () => ({
  BudgetProgress: ({ budgets }: { budgets: Array<{ id: string; spent: number }> }) => (
    <div data-testid="budget-data">
      {budgets.map((item) => `${item.id}:${item.spent}`).join(",")}
    </div>
  ),
}));
vi.mock("@/components/dashboard/GoalsProgress", () => ({
  GoalsProgress: () => null,
}));
vi.mock("@/components/transactions/TransactionList", () => ({
  TransactionList: ({ transactions }: { transactions: Transaction[] }) => (
    <div data-testid="recent-count">{transactions.length}</div>
  ),
}));

const analyticsForCurrentMonth = (): ReportAnalytics => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  return {
    year,
    summary: { year, income: 10_000, expense: 4_000, balance: 6_000, savingsRate: 60 },
    monthly: [{ month, income: 5_000, expense: 1_200, balance: 3_800 }],
    categories: [],
    currentMonthComparison: {
      currentExpense: 1_200,
      lastExpense: 900,
      variation: 33.3,
      hasVariationBaseline: true,
    },
    currentMonthCategories: [
      {
        categoryId: "category-food",
        name: "Food",
        type: "expense",
        color: "#f97316",
        value: 1_200,
      },
    ],
    availableYears: [year],
  };
};

const truncatedTransaction: Transaction = {
  id: "tx-page-1",
  user_id: "user-1",
  category_id: "category-food",
  description: "Only loaded row",
  amount: 999_999,
  type: "expense",
  date: "2026-08-21T00:00:00.000Z",
  is_recurring: false,
  created_at: "2026-08-21T12:00:00.000Z",
};

describe("Dashboard server aggregates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseTransactions.mockReturnValue({
      transactions: [truncatedTransaction],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      deleteTransaction: { mutate: vi.fn() },
    });
  });

  it("uses complete report aggregates instead of the truncated history page", () => {
    mockedUseReportAnalytics.mockReturnValue({
      analytics: analyticsForCurrentMonth(),
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<Index />);

    expect(screen.getByText("dashboard.balance:currency:3800")).toBeInTheDocument();
    expect(screen.getByText("dashboard.expenses:currency:1200")).toBeInTheDocument();
    expect(screen.getByTestId("expense-data")).toHaveTextContent("Food:1200");
    expect(screen.getByTestId("budget-data")).toHaveTextContent("budget-1:1200");
    expect(screen.getByTestId("recent-count")).toHaveTextContent("1");
    expect(screen.queryByText(/999999/)).not.toBeInTheDocument();
  });

  it("shows an explicit retry when aggregate loading fails", () => {
    const refetch = vi.fn();
    mockedUseReportAnalytics.mockReturnValue({
      analytics: null,
      isLoading: false,
      isError: true,
      error: new Error("analytics unavailable"),
      refetch,
    });

    render(<Index />);

    expect(screen.getByRole("alert")).toHaveTextContent("dashboard.analyticsError");
    fireEvent.click(screen.getByRole("button", { name: "transactions.retry" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
