/**
 * Provides investment queries and mutations while translating UI-friendly field
 * names into API payloads with safe partial-update semantics.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { Investment } from "@/types/finance";
import { apiRequest } from "@/lib/api";
import { ApiInvestment, mapInvestment } from "@/lib/api-mappers";

type CreateInvestmentPayload = {
  name: string;
  category?: string | null;
  invested_amount: number;
  current_value: number;
  start_date?: string | null;
  notes?: string | null;
};

type UpdateInvestmentPayload = {
  id: string;
  name?: string;
  category?: string | null;
  invested_amount?: number;
  current_value?: number;
  start_date?: string | null;
  notes?: string | null;
};

const toCreateApiPayload = (investment: CreateInvestmentPayload) => ({
  name: investment.name,
  category: investment.category ?? null,
  investedAmount: investment.invested_amount,
  currentValue: investment.current_value,
  startDate: investment.start_date ?? null,
  notes: investment.notes ?? null,
});

const toUpdateApiPayload = (updates: Omit<UpdateInvestmentPayload, "id">) => {
  const body: Record<string, unknown> = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.category !== undefined) body.category = updates.category;
  if (updates.invested_amount !== undefined) body.investedAmount = updates.invested_amount;
  if (updates.current_value !== undefined) body.currentValue = updates.current_value;
  if (updates.start_date !== undefined) body.startDate = updates.start_date;
  if (updates.notes !== undefined) body.notes = updates.notes;
  return body;
};

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
    mutationFn: async (investment: CreateInvestmentPayload) => {
      if (!user || !token) throw new Error("Not authenticated");
      return apiRequest<ApiInvestment>("/investments", {
        method: "POST",
        token,
        body: toCreateApiPayload(investment),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
    },
  });

  const updateInvestment = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateInvestmentPayload) => {
      if (!user || !token) throw new Error("Not authenticated");
      await apiRequest(`/investments/${id}`, {
        method: "PATCH",
        token,
        body: toUpdateApiPayload(updates),
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
