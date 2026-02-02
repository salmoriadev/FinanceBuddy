import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { Investment } from "@/types/finance";
import { apiRequest } from "@/lib/api";
import { ApiInvestment, mapInvestment } from "@/lib/api-mappers";

export function useInvestments() {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const token = accessToken;

  const investmentsQuery = useQuery({
    queryKey: ["investments", user?.id],
    queryFn: async () => {
      if (!user || !token) return [];
      const data = await apiRequest<ApiInvestment[]>("/investments", { token });
      return data.map(mapInvestment) as Investment[];
    },
    enabled: !!user && !!token,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const addInvestment = useMutation({
    mutationFn: async (investment: {
      name: string;
      category?: string | null;
      invested_amount: number;
      current_value: number;
      start_date?: string | null;
      notes?: string | null;
    }) => {
      if (!user || !token) throw new Error("Not authenticated");
      return apiRequest<ApiInvestment>("/investments", {
        method: "POST",
        token,
        body: {
          name: investment.name,
          category: investment.category ?? null,
          investedAmount: investment.invested_amount,
          currentValue: investment.current_value,
          startDate: investment.start_date ?? null,
          notes: investment.notes ?? null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
    },
  });

  const updateInvestment = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      category?: string | null;
      invested_amount?: number;
      current_value?: number;
      start_date?: string | null;
      notes?: string | null;
    }) => {
      if (!user || !token) throw new Error("Not authenticated");
      await apiRequest(`/investments/${id}`, {
        method: "PATCH",
        token,
        body: {
          name: updates.name,
          category: updates.category ?? null,
          investedAmount: updates.invested_amount,
          currentValue: updates.current_value,
          startDate: updates.start_date ?? null,
          notes: updates.notes ?? null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
    },
  });

  const deleteInvestment = useMutation({
    mutationFn: async (id: string) => {
      if (!user || !token) throw new Error("Not authenticated");
      await apiRequest(`/investments/${id}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
    },
  });

  return {
    investments: investmentsQuery.data ?? [],
    isLoading: investmentsQuery.isLoading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
  };
}
