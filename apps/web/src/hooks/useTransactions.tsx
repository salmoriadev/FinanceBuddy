import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { Transaction, TransactionType } from "@/types/finance";
import { apiRequest } from "@/lib/api";
import { ApiTransaction, mapTransaction } from "@/lib/api-mappers";

const TRANSACTIONS_PAGE_SIZE = 100;

type ApiTransactionsPage = {
  items: ApiTransaction[];
  pageInfo: {
    hasMore: boolean;
    nextCursor: string | null;
  };
};

export function useTransactions() {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const token = accessToken;
  const invalidateFinancialQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["reports"] }),
    ]);
  };

  const transactionsQuery = useInfiniteQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async ({ pageParam }) => {
      if (!user || !token) {
        return {
          items: [],
          pageInfo: { hasMore: false, nextCursor: null },
        } satisfies ApiTransactionsPage;
      }
      const query = new URLSearchParams({
        limit: String(TRANSACTIONS_PAGE_SIZE),
      });
      if (pageParam) query.set("cursor", pageParam);
      return apiRequest<ApiTransactionsPage>(`/transactions?${query}`, {
        token,
      });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasMore ? lastPage.pageInfo.nextCursor : undefined,
    enabled: !!user && !!token,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const transactions =
    transactionsQuery.data?.pages.flatMap((page) =>
      page.items.map(mapTransaction),
    ) ?? [];

  const addTransaction = useMutation({
    mutationFn: async (transaction: {
      description: string;
      amount: number;
      type: TransactionType;
      category_id: string | null;
      date: string;
      is_recurring?: boolean;
    }) => {
      if (!user || !token) throw new Error("Sessão expirada. Entre novamente.");
      return apiRequest<ApiTransaction>("/transactions", {
        method: "POST",
        token,
        body: {
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          categoryId: transaction.category_id,
          date: transaction.date,
          isRecurring: transaction.is_recurring,
        },
      });
    },
    onSuccess: invalidateFinancialQueries,
  });

  const updateTransaction = useMutation({
    mutationFn: async (transaction: {
      id: string;
      description?: string;
      amount?: number;
      type?: TransactionType;
      category_id?: string | null;
      date?: string;
      is_recurring?: boolean;
    }) => {
      if (!user || !token) throw new Error("Sessão expirada. Entre novamente.");
      const body: Record<string, unknown> = {};
      if (transaction.description !== undefined) body.description = transaction.description;
      if (transaction.amount !== undefined) body.amount = transaction.amount;
      if (transaction.type !== undefined) body.type = transaction.type;
      if (transaction.category_id !== undefined) body.categoryId = transaction.category_id;
      if (transaction.date !== undefined) body.date = transaction.date;
      if (transaction.is_recurring !== undefined) body.isRecurring = transaction.is_recurring;

      return apiRequest<ApiTransaction>(`/transactions/${transaction.id}`, {
        method: "PATCH",
        token,
        body,
      });
    },
    onSuccess: invalidateFinancialQueries,
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      if (!user || !token) throw new Error("Sessão expirada. Entre novamente.");
      await apiRequest(`/transactions/${id}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: invalidateFinancialQueries,
  });

  return {
    transactions: transactions as Transaction[],
    isLoading: transactionsQuery.isPending,
    isError: transactionsQuery.isError,
    isFetchNextPageError: transactionsQuery.isFetchNextPageError,
    error: transactionsQuery.error,
    refetch: transactionsQuery.refetch,
    fetchNextPage: transactionsQuery.fetchNextPage,
    hasNextPage: transactionsQuery.hasNextPage,
    isFetchingNextPage: transactionsQuery.isFetchingNextPage,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
