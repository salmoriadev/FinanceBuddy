import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReportAnalytics } from "@/hooks/useReports";
import { apiRequest } from "@/lib/api";
import { ReportAnalytics } from "@/types/finance";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "user@example.com" },
    accessToken: "access-token",
  }),
}));

vi.mock("@/lib/api", () => ({
  apiRequest: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);

const analyticsFor = (year: number): ReportAnalytics => ({
  year,
  summary: {
    year,
    income: year,
    expense: 0,
    balance: year,
    savingsRate: 100,
  },
  monthly: [],
  categories: [],
  currentMonthComparison: {
    currentExpense: 0,
    lastExpense: 0,
    variation: null,
    hasVariationBaseline: false,
  },
  currentMonthCategories: [],
  availableYears: [year],
});

describe("useReportAnalytics", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("never exposes prior-year analytics while a newly selected year loads", async () => {
    let resolveNextYear: ((value: ReturnType<typeof analyticsFor>) => void) | undefined;
    const nextYearRequest = new Promise<ReturnType<typeof analyticsFor>>((resolve) => {
      resolveNextYear = resolve;
    });

    mockedApiRequest
      .mockResolvedValueOnce(analyticsFor(2025))
      .mockReturnValueOnce(nextYearRequest);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result, rerender } = renderHook(
      ({ year }) => useReportAnalytics(year),
      { initialProps: { year: 2025 }, wrapper },
    );

    await waitFor(() => expect(result.current.analytics?.year).toBe(2025));

    rerender({ year: 2026 });

    expect(result.current.analytics).toBeNull();
    expect(result.current.isLoading).toBe(true);

    resolveNextYear?.(analyticsFor(2026));
    await waitFor(() => expect(result.current.analytics?.year).toBe(2026));

    queryClient.clear();
  });

  it("exposes a rejected analytics request for an explicit error state", async () => {
    const requestError = new Error("analytics unavailable");
    mockedApiRequest.mockRejectedValueOnce(requestError);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useReportAnalytics(2026), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.analytics).toBeNull();
    expect(result.current.error).toBe(requestError);
    expect(result.current.refetch).toEqual(expect.any(Function));

    queryClient.clear();
  });
});
