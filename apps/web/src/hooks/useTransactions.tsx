import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { Transaction, TransactionType } from "@/types/finance";
import { apiRequest } from "@/lib/api";
import { ApiTransaction, mapTransaction } from "@/lib/api-mappers";

export function useTransactions() {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const token = accessToken;

  const transactionsQuery = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user || !token) return [];
      const data = await apiRequest<ApiTransaction[]>("/transactions", {
        token,
      });
      return data.map(mapTransaction) as Transaction[];
    },
    enabled: !!user && !!token,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: {
      description: string;
      amount: number;
      type: TransactionType;
      category_id: string | null;
      date: string;
      is_recurring?: boolean;
    }) => {
      if (!user || !token) throw new Error("Not authenticated");
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
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
      if (!user || !token) throw new Error("Not authenticated");
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      if (!user || !token) throw new Error("Not authenticated");
      await apiRequest(`/transactions/${id}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: transactionsQuery.isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
