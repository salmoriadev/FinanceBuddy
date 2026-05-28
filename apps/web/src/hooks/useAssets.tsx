import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiRequest } from "@/lib/api";
import { ApiAsset, ApiQuote, mapAsset, mapQuote } from "@/lib/api-mappers";
import { AssetClass, InvestmentAssetSearchResult } from "@/types/finance";
import { useAuth } from "./useAuth";

type CreateAssetPayload = {
  ticker: string;
  name: string;
  class: AssetClass;
  sector?: string | null;
  currency?: string | null;
  notes?: string | null;
};

type AddManualQuotePayload = {
  assetId: string;
  price: number;
  currency?: string | null;
  source?: string | null;
  quotedAt?: string | null;
};

type LookupQuotePayload = {
  assetId: string;
  date?: string | null;
};

export function useAssets() {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const token = accessToken;

  const assetsQuery = useQuery({
    queryKey: ["assets", user?.id],
    queryFn: async () => {
      if (!user || !token) return [];
      const data = await apiRequest<ApiAsset[]>("/assets", { token });
      return data.map(mapAsset);
    },
    enabled: !!user && !!token,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const addAsset = useMutation({
    mutationFn: async (asset: CreateAssetPayload) => {
      if (!user || !token) throw new Error("Not authenticated");
      const data = await apiRequest<ApiAsset>("/assets", {
        method: "POST",
        token,
        body: asset,
      });
      return mapAsset(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  const addManualQuote = useMutation({
    mutationFn: async ({ assetId, ...quote }: AddManualQuotePayload) => {
      if (!user || !token) throw new Error("Not authenticated");
      const data = await apiRequest<ApiQuote>(`/assets/${assetId}/quotes/manual`, {
        method: "POST",
        token,
        body: {
          ...quote,
          price: String(quote.price),
        },
      });
      return mapQuote(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-positions"] });
    },
  });

  const refreshAssetQuote = useMutation({
    mutationFn: async (assetId: string) => {
      if (!user || !token) throw new Error("Not authenticated");
      return apiRequest<{
        assetId: string;
        status: "current" | "stale" | "manual" | "estimated" | "incomplete";
        cacheHit: boolean;
        quote: ApiQuote | null;
        error?: string;
      }>(`/assets/${assetId}/quotes/refresh`, {
        method: "POST",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-positions"] });
    },
  });

  const lookupQuote = useMutation({
    mutationFn: async ({ assetId, date }: LookupQuotePayload) => {
      if (!user || !token) throw new Error("Not authenticated");
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const data = await apiRequest<{
        assetId: string;
        status: "current" | "stale" | "manual" | "estimated" | "incomplete";
        cacheHit: boolean;
        quote: ApiQuote | null;
        fallback?: "latest" | "cached" | null;
        error?: string;
      }>(`/assets/${assetId}/quotes/lookup${suffix}`, {
        token,
      });
      return {
        ...data,
        quote: data.quote ? mapQuote(data.quote) : null,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-positions"] });
    },
  });

  const searchAssets = useCallback(async (query: string, assetClass?: AssetClass) => {
    if (!user || !token || query.trim().length < 2) return [];
    const params = new URLSearchParams({ q: query.trim() });
    if (assetClass) params.set("class", assetClass);
    return apiRequest<InvestmentAssetSearchResult[]>(
      `/assets/search?${params.toString()}`,
      { token },
    );
  }, [token, user]);

  return {
    assets: assetsQuery.data ?? [],
    isLoading: assetsQuery.isLoading,
    addAsset,
    addManualQuote,
    refreshAssetQuote,
    lookupQuote,
    searchAssets,
  };
}
