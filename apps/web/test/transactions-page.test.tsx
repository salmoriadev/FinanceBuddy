import { fireEvent, render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Transactions from "@/pages/Transactions";
import type { Transaction } from "@/types/finance";

const { mockedUseTransactions } = vi.hoisted(() => ({
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
vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({ categories: [] }),
}));
vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("@/hooks/useCategoryLabels", () => ({
  useCategoryLabels: () => ({ labelForCategory: () => "Category" }),
}));
vi.mock("@/components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/transactions/TransactionForm", () => ({
  TransactionForm: () => null,
}));
vi.mock("@/components/transactions/TransactionList", () => ({
  TransactionList: ({ transactions }: { transactions: Transaction[] }) => (
    <div data-testid="transaction-count">{transactions.length}</div>
  ),
}));

const loadedTransaction: Transaction = {
  id: "tx-1",
  user_id: "user-1",
  category_id: null,
  description: "Loaded transaction",
  amount: 10,
  type: "expense",
  date: "2026-08-21T00:00:00.000Z",
  is_recurring: false,
  created_at: "2026-08-21T12:00:00.000Z",
};

const mutations = {
  addTransaction: { isPending: false, mutateAsync: vi.fn() },
  updateTransaction: { isPending: false, mutateAsync: vi.fn() },
  deleteTransaction: { mutate: vi.fn() },
};

describe("Transactions page pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers an accessible load-more action while another cursor page exists", () => {
    const fetchNextPage = vi.fn();
    mockedUseTransactions.mockReturnValue({
      transactions: [loadedTransaction],
      isLoading: false,
      isError: false,
      isFetchNextPageError: false,
      refetch: vi.fn(),
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
      ...mutations,
    });

    render(<Transactions />);

    expect(screen.getByTestId("transaction-count")).toHaveTextContent("1");
    const loadMore = screen.getByRole("button", {
      name: "transactions.loadMore",
    });
    fireEvent.click(loadMore);
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("shows a retryable alert when the first history page fails", () => {
    const refetch = vi.fn();
    mockedUseTransactions.mockReturnValue({
      transactions: [],
      isLoading: false,
      isError: true,
      isFetchNextPageError: false,
      refetch,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      ...mutations,
    });

    render(<Transactions />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "transactions.loadError",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "transactions.retry" }),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
