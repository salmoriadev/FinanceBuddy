import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Investment } from "@/types/finance";

export function useInvestments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const investmentsQuery = useQuery({
    queryKey: ["investments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Investment[];
    },
    enabled: !!user,
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
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("investments")
        .insert({ ...investment, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("investments")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
    },
  });

  const deleteInvestment = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("investments")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
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
