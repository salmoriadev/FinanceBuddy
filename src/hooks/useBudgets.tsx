import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Budget } from "@/types/finance";

export function useBudgets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const budgetsQuery = useQuery({
    queryKey: ["budgets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("budgets")
        .select("*, category:categories(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });

  const addBudget = useMutation({
    mutationFn: async (budget: {
      category_id: string;
      amount: number;
      month: number;
      year: number;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("budgets")
        .insert({ ...budget, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("budgets")
        .update({ amount })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
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
