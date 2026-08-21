import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
    placeholderData: keepPreviousData,
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
    mutationFn: async (payload: {
      id: string;
      name?: string;
      target_amount?: number;
      current_amount?: number;
      target_date?: string | null;
      color?: string;
    }) => {
      if (!user || !token) throw new Error("Not authenticated");
      const body: Record<string, unknown> = {};
      if (payload.name !== undefined) body.name = payload.name;
      if (payload.target_amount !== undefined) body.targetAmount = payload.target_amount;
      if (payload.current_amount !== undefined) body.currentAmount = payload.current_amount;
      if (payload.target_date !== undefined) body.targetDate = payload.target_date;
      if (payload.color !== undefined) body.color = payload.color;

      await apiRequest(`/goals/${payload.id}`, {
        method: "PATCH",
        token,
        body,
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
