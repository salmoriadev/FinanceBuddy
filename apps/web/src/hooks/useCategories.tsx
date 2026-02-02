import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { Category, TransactionType } from "@/types/finance";
import { apiRequest } from "@/lib/api";
import { ApiCategory, mapCategory } from "@/lib/api-mappers";

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
    addCategory,
  };
}
