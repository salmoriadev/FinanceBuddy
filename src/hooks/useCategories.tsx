import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Category, TransactionType } from "@/types/finance";

const defaultCategories = [
  {
    name: "Alimentação",
    color: "#ef4444",
    icon: "utensils",
    type: "expense" as TransactionType,
  },
  {
    name: "Transporte",
    color: "#3b82f6",
    icon: "car",
    type: "expense" as TransactionType,
  },
  {
    name: "Moradia",
    color: "#8b5cf6",
    icon: "home",
    type: "expense" as TransactionType,
  },
  {
    name: "Lazer",
    color: "#f59e0b",
    icon: "gamepad-2",
    type: "expense" as TransactionType,
  },
  {
    name: "Saúde",
    color: "#10b981",
    icon: "heart-pulse",
    type: "expense" as TransactionType,
  },
  {
    name: "Educação",
    color: "#06b6d4",
    icon: "graduation-cap",
    type: "expense" as TransactionType,
  },
  {
    name: "Salário",
    color: "#22c55e",
    icon: "wallet",
    type: "income" as TransactionType,
  },
  {
    name: "Freelance",
    color: "#84cc16",
    icon: "laptop",
    type: "income" as TransactionType,
  },
  {
    name: "Investimentos",
    color: "#eab308",
    icon: "trending-up",
    type: "income" as TransactionType,
  },
];

export function useCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["categories", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!user,
  });

  const initializeCategories = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (existing && existing.length > 0) return;

      const categoriesToInsert = defaultCategories.map((cat) => ({
        ...cat,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from("categories")
        .insert(categoriesToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  useEffect(() => {
    if (!user || !categoriesQuery.isSuccess) return;
    if ((categoriesQuery.data?.length ?? 0) > 0) return;
    if (!initializeCategories.isPending) {
      initializeCategories.mutate();
    }
  }, [
    user,
    categoriesQuery.isSuccess,
    categoriesQuery.data?.length,
    initializeCategories,
  ]);

  const addCategory = useMutation({
    mutationFn: async (category: {
      name: string;
      color: string;
      icon: string;
      type: TransactionType;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("categories")
        .insert({ ...category, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return {
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    initializeCategories,
    addCategory,
  };
}
