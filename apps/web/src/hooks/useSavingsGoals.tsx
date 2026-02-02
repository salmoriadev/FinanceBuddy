import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { SavingsGoal } from "@/types/finance";
import { apiRequest } from "@/lib/api";
import { ApiSavingsGoal, mapGoal } from "@/lib/api-mappers";

export function useSavingsGoals() {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const token = accessToken;

  const goalsQuery = useQuery({
    queryKey: ["savings_goals", user?.id],
    queryFn: async () => {
      if (!user || !token) return [];
      const data = await apiRequest<ApiSavingsGoal[]>("/goals", { token });
      return data.map(mapGoal) as SavingsGoal[];
    },
    enabled: !!user && !!token,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const addGoal = useMutation({
    mutationFn: async (goal: {
      name: string;
      target_amount: number;
      current_amount?: number;
      target_date?: string;
      color?: string;
    }) => {
      if (!user || !token) throw new Error("Not authenticated");
      return apiRequest<ApiSavingsGoal>("/goals", {
        method: "POST",
        token,
        body: {
          name: goal.name,
          targetAmount: goal.target_amount,
          currentAmount: goal.current_amount,
          targetDate: goal.target_date,
          color: goal.color,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, current_amount }: { id: string; current_amount: number }) => {
      if (!user || !token) throw new Error("Not authenticated");
      await apiRequest(`/goals/${id}`, {
        method: "PATCH",
        token,
        body: { currentAmount: current_amount },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      if (!user || !token) throw new Error("Not authenticated");
      await apiRequest(`/goals/${id}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
    },
  });

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    addGoal,
    updateGoal,
    deleteGoal,
  };
}
