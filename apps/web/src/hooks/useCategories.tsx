import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { Category, TransactionType } from "@/types/finance";
import { apiRequest } from "@/lib/api";
import { ApiCategory, mapCategory } from "@/lib/api-mappers";

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
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const token = accessToken;

  const categoriesQuery = useQuery({
    queryKey: ["categories", user?.id],
    queryFn: async () => {
      if (!user || !token) return [];
      const data = await apiRequest<ApiCategory[]>("/categories", { token });
      return data.map(mapCategory) as Category[];
    },
    enabled: !!user && !!token,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const initializeCategories = useMutation({
    mutationFn: async () => {
      if (!user || !token) throw new Error("Not authenticated");
      const existing = categoriesQuery.data ?? [];
      if (existing.length > 0) return;

      await Promise.all(
        defaultCategories.map((category) =>
          apiRequest<ApiCategory>("/categories", {
            method: "POST",
            token,
            body: {
              name: category.name,
              color: category.color,
              icon: category.icon,
              type: category.type,
            },
          }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  useEffect(() => {
    if (!user || !token || !categoriesQuery.isSuccess) return;
    if ((categoriesQuery.data?.length ?? 0) > 0) return;
    if (!initializeCategories.isPending) {
      initializeCategories.mutate();
    }
  }, [
    user,
    token,
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
      if (!user || !token) throw new Error("Not authenticated");
      return apiRequest<ApiCategory>("/categories", {
        method: "POST",
        token,
        body: {
          name: category.name,
          color: category.color,
          icon: category.icon,
          type: category.type,
        },
      });
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
