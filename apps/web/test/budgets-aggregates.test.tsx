import { fireEvent, render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Budgets from "@/pages/Budgets";
import type { ReportAnalytics } from "@/types/finance";

const { mockedUseReportAnalytics } = vi.hoisted(() => ({
  mockedUseReportAnalytics: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "user@example.com" },
    loading: false,
  }),
}));
vi.mock("@/hooks/useReports", () => ({
  useReportAnalytics: mockedUseReportAnalytics,
}));
vi.mock("@/hooks/useBudgets", () => ({
  useBudgets: () => ({
    budgets: [
      {
        id: "budget-1",
        user_id: "user-1",
        category_id: "category-food",
        amount: 2_000,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        created_at: "2026-08-01T00:00:00.000Z",
        category: {
          id: "category-food",
          user_id: "user-1",
          name: "Food",
          color: "#f97316",
          icon: "utensils",
          type: "expense",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      },
    ],
    isLoading: false,
    addBudget: { isPending: false, mutateAsync: vi.fn() },
    updateBudget: { isPending: false, mutateAsync: vi.fn() },
    deleteBudget: { mutate: vi.fn() },
  }),
}));
vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({
    categories: [
      {
        id: "category-food",
        name: "Food",
        color: "#f97316",
        type: "expense",
      },
    ],
  }),
}));
vi.mock("@/hooks/useFormatter", () => ({
  useFormatter: () => ({
    formatCurrency: (value: number) => `currency:${value}`,
    monthsLong: Array.from({ length: 12 }, (_, index) => `month-${index + 1}`),
    locale: "en",
  }),
}));
vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("@/hooks/useCategoryLabels", () => ({
  useCategoryLabels: () => ({ labelForCategory: (category: { name: string }) => category.name }),
}));
vi.mock("@/components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const analyticsForCurrentMonth = (): ReportAnalytics => {
  const year = new Date().getFullYear();
  return {
    year,
    summary: { year, income: 5_000, expense: 1_200, balance: 3_800, savingsRate: 76 },
    monthly: [],
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

describe("Budget server aggregates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses complete current-month category spending from reports", () => {
    mockedUseReportAnalytics.mockReturnValue({
      analytics: analyticsForCurrentMonth(),
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<Budgets />);

    expect(screen.getByText("currency:2000")).toBeInTheDocument();
    expect(screen.getAllByText("currency:1200")).not.toHaveLength(0);
    expect(screen.getByText(/currency:1200 de currency:2000/)).toBeInTheDocument();
  });

  it("shows an explicit retry instead of zero spent when analytics fail", () => {
    const refetch = vi.fn();
    mockedUseReportAnalytics.mockReturnValue({
      analytics: null,
      isLoading: false,
      isError: true,
      error: new Error("analytics unavailable"),
      refetch,
    });

    render(<Budgets />);

    expect(screen.getByRole("alert")).toHaveTextContent("budgets.analyticsError");
    expect(screen.queryByText("currency:0")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "transactions.retry" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
