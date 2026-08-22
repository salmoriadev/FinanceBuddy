import { useMemo } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { Category, TransactionType } from "@/types/finance";
import { apiRequest } from "@/lib/api";
import { ApiCategory, mapCategory } from "@/lib/api-mappers";
import { getCategoryLabel, normalizeCategoryKey } from "@/lib/category-labels";
import { usePreferences } from "@/hooks/usePreferences";

const dedupeCategories = (items: Category[], locale: "en" | "pt-BR") => {
  const unique = new Map<string, Category>();
  items.forEach((category) => {
    const label = getCategoryLabel(category.name, category.type, locale);
    const key = `${category.type}:${normalizeCategoryKey(label)}`;
    if (!unique.has(key)) {
      unique.set(key, category);
    }
  });
  return Array.from(unique.values());
};

export function useCategories() {
  const { user, accessToken } = useAuth();
  const { locale } = usePreferences();
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
    placeholderData: keepPreviousData,
  });

  const categories = useMemo(
    () => dedupeCategories(categoriesQuery.data ?? [], locale),
    [categoriesQuery.data, locale],
  );

  const addCategory = useMutation({
    mutationFn: async (category: {
      name: string;
      color: string;
      icon: string;
      type: TransactionType;
    }) => {
      if (!user || !token) throw new Error("Sessão expirada. Entre novamente.");
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
    categories,
    isLoading: categoriesQuery.isLoading,
    addCategory,
  };
}
