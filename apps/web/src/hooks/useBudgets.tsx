import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { Budget } from "@/types/finance";
import { apiRequest } from "@/lib/api";
import { ApiBudget, mapBudget } from "@/lib/api-mappers";

export function useBudgets() {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const token = accessToken;

  const budgetsQuery = useQuery({
    queryKey: ["budgets", user?.id],
    queryFn: async () => {
      if (!user || !token) return [];
      const data = await apiRequest<ApiBudget[]>("/budgets", { token });
      return data.map(mapBudget) as Budget[];
    },
    enabled: !!user && !!token,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const addBudget = useMutation({
    mutationFn: async (budget: {
      category_id: string;
      amount: number;
      month: number;
      year: number;
    }) => {
      if (!user || !token) throw new Error("Not authenticated");
      return apiRequest<ApiBudget>("/budgets", {
        method: "POST",
        token,
        body: {
          categoryId: budget.category_id,
          amount: budget.amount,
          month: budget.month,
          year: budget.year,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      if (!user || !token) throw new Error("Not authenticated");
      await apiRequest(`/budgets/${id}`, {
        method: "PATCH",
        token,
        body: { amount },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      if (!user || !token) throw new Error("Not authenticated");
      await apiRequest(`/budgets/${id}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  return {
    budgets: budgetsQuery.data ?? [],
    isLoading: budgetsQuery.isLoading,
    addBudget,
    updateBudget,
    deleteBudget,
  };
}
