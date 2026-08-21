import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTransactions } from "@/hooks/useTransactions";
import { apiRequest } from "@/lib/api";
import type { ApiTransaction } from "@/lib/api-mappers";

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

const transaction = (id: string): ApiTransaction => ({
  id,
  userId: "user-1",
  categoryId: null,
  description: `Transaction ${id}`,
  amount: 10,
  type: "expense",
  date: "2026-08-21T00:00:00.000Z",
  isRecurring: false,
  createdAt: "2026-08-21T12:00:00.000Z",
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
};

describe("useTransactions pagination", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("appends cursor pages without truncating loaded history", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({
        items: [transaction("tx-1"), transaction("tx-2")],
        pageInfo: { hasMore: true, nextCursor: "next-cursor" },
      })
      .mockResolvedValueOnce({
        items: [transaction("tx-3")],
        pageInfo: { hasMore: false, nextCursor: null },
      });
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useTransactions(), { wrapper });

    await waitFor(() => expect(result.current.transactions).toHaveLength(2));
    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      1,
      "/transactions?limit=100",
      { token: "access-token" },
    );
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() =>
      expect(result.current.transactions.map(({ id }) => id)).toEqual([
        "tx-1",
        "tx-2",
        "tx-3",
      ]),
    );
    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      2,
      "/transactions?limit=100&cursor=next-cursor",
      { token: "access-token" },
    );
    expect(result.current.hasNextPage).toBe(false);
    queryClient.clear();
  });

  it("exposes initial history failures for an explicit retry state", async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error("history unavailable"));
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useTransactions(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.transactions).toEqual([]);
    expect(result.current.error).toEqual(new Error("history unavailable"));
    expect(result.current.refetch).toEqual(expect.any(Function));
    queryClient.clear();
  });
});
