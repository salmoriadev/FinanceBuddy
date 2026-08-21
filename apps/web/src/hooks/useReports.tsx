/**
 * Fetches pre-aggregated report analytics so the UI can render charts and KPI
 * cards without scanning the full transactions dataset on the client.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { apiRequest } from "@/lib/api";
import { ReportAnalytics } from "@/types/finance";

export function useReportAnalytics(year: number) {
  const { user, accessToken } = useAuth();
  const token = accessToken;

  const analyticsQuery = useQuery({
    queryKey: ["reports", "analytics", user?.id, year],
    queryFn: async () => {
      if (!user || !token) return null;
      return apiRequest<ReportAnalytics>(`/reports/analytics?year=${year}`, {
        token,
      });
    },
    enabled: !!user && !!token,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    analytics: analyticsQuery.data ?? null,
    isLoading: analyticsQuery.isLoading,
  };
}
