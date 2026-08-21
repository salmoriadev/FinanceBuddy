import { fireEvent, render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { ReportAnalytics } from "@/types/finance";
import Reports from "@/pages/Reports";

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

vi.mock("@/hooks/useInvestments", () => ({
  useInvestments: () => ({ investments: [] }),
}));

vi.mock("@/hooks/useFormatter", () => ({
  useFormatter: () => ({
    formatCurrency: (value: number) => `currency:${value}`,
    formatPercent: (value: number) => `percent:${value}`,
    formatCompactCurrency: (value: number) => String(value),
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

vi.mock("@/components/dashboard/ExpenseChart", () => ({
  ExpenseChart: () => null,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
  }) => (
    <select
      aria-label="report-year"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: ReactNode;
  }) => <option value={value}>{children}</option>,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
  BarChart: ({ children }: { children: ReactNode }) => <>{children}</>,
  LineChart: ({ children }: { children: ReactNode }) => <>{children}</>,
  Bar: () => null,
  CartesianGrid: () => null,
  Legend: () => null,
  Line: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const analyticsFor = (
  year: number,
  availableYears: number[],
  income: number,
): ReportAnalytics => ({
  year,
  summary: {
    year,
    income,
    expense: 1_000,
    balance: 4_000,
    savingsRate: 80,
  },
  monthly: [],
  categories: [],
  currentMonthComparison: {
    currentExpense: 0,
    lastExpense: 0,
    variation: null,
    hasVariationBaseline: false,
  },
  availableYears,
});

describe("Reports page", () => {
  it("keeps a historical year selected and masks old analytics while it loads", () => {
    const currentYear = new Date().getFullYear();
    const historicalYear = currentYear - 1;
    let historicalAnalytics: ReportAnalytics | null = null;

    mockedUseReportAnalytics.mockImplementation((year: number) => {
      if (year === currentYear) {
        return {
          analytics: analyticsFor(
            currentYear,
            [currentYear, historicalYear],
            5_000,
          ),
          isLoading: false,
        };
      }
      return historicalAnalytics
        ? { analytics: historicalAnalytics, isLoading: false }
        : { analytics: null, isLoading: true };
    });

    const { rerender } = render(<Reports />);

    expect(screen.getByText("currency:5000")).toBeInTheDocument();

    const yearSelect = screen.getByLabelText("report-year");
    fireEvent.change(yearSelect, {
      target: { value: historicalYear.toString() },
    });

    expect(yearSelect).toHaveValue(historicalYear.toString());
    expect(mockedUseReportAnalytics).toHaveBeenLastCalledWith(historicalYear);
    expect(screen.queryByText("currency:5000")).not.toBeInTheDocument();
    expect(screen.queryByText(/^currency:/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "common.loading" }),
    ).toBeInTheDocument();

    historicalAnalytics = analyticsFor(
      historicalYear,
      [currentYear, historicalYear],
      2_400,
    );
    rerender(<Reports />);

    expect(yearSelect).toHaveValue(historicalYear.toString());
    expect(
      screen.queryByRole("status", { name: "common.loading" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(`reports.income ${historicalYear}`),
    ).toBeInTheDocument();
    const historicalIncome = screen.getByText("currency:2400");
    expect(historicalIncome).toBeInTheDocument();
    expect(historicalIncome.closest(".space-y-6")).toBeInTheDocument();
    expect(screen.queryByText("currency:5000")).not.toBeInTheDocument();
    expect(
      screen.queryByText(`reports.income ${currentYear}`),
    ).not.toBeInTheDocument();
  });
});
