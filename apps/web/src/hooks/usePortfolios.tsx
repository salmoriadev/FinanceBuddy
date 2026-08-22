import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import {
  ApiPortfolioDividendReceipt,
  ApiPortfolioMonthlyReport,
  ApiPortfolio,
  ApiPortfolioPosition,
  mapPortfolioDividendReceipt,
  mapPortfolio,
  mapPortfolioPosition,
} from "@/lib/api-mappers";
import {
  DividendEventStatus,
  PortfolioMonthlyReport,
  PortfolioTransactionType,
} from "@/types/finance";
import { useAuth } from "./useAuth";
import { toPlainDecimalString } from "@/lib/number";

type CreatePortfolioTransactionPayload = {
  assetId: string;
  type: PortfolioTransactionType;
  quantity?: number | null;
  unitPrice?: number | null;
  totalAmount?: number | null;
  fees?: number | null;
  taxes?: number | null;
  currency?: string | null;
  occurredAt: string;
  notes?: string | null;
};

type CreateDividendPayload = {
  assetId: string;
  status?: DividendEventStatus;
  quantity?: number | null;
  amountPerShare: number;
  taxes?: number | null;
  totalAmount?: number | null;
  currency?: string | null;
  exDate?: string | null;
  paymentDate: string;
  source?: string | null;
  notes?: string | null;
};

type ReceiveDividendPayload = {
  receiptId: string;
  quantity?: number | null;
  amountPerShare?: number | null;
  taxes?: number | null;
  totalAmount?: number | null;
  receivedAt?: string | null;
  notes?: string | null;
};

export function usePortfolios() {
  const { user, accessToken } = useAuth();
  const token = accessToken;

  const portfoliosQuery = useQuery({
    queryKey: ["portfolios", user?.id],
    queryFn: async () => {
      if (!user || !token) return [];
      const data = await apiRequest<ApiPortfolio[]>("/portfolios", { token });
      return data.map(mapPortfolio);
    },
    enabled: !!user && !!token,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    portfolios: portfoliosQuery.data ?? [],
    defaultPortfolio:
      portfoliosQuery.data?.find((portfolio) => portfolio.is_default) ??
      portfoliosQuery.data?.[0] ??
      null,
    isLoading: portfoliosQuery.isLoading,
    error: portfoliosQuery.error,
  };
}

export function usePortfolioPositions(portfolioId?: string | null) {
  const { user, accessToken } = useAuth();
  const token = accessToken;

  const positionsQuery = useQuery({
    queryKey: ["portfolio-positions", user?.id, portfolioId],
    queryFn: async () => {
      if (!user || !token || !portfolioId) return [];
      const data = await apiRequest<ApiPortfolioPosition[]>(
        `/portfolios/${portfolioId}/positions`,
        { token },
      );
      return data.map(mapPortfolioPosition);
    },
    enabled: !!user && !!token && !!portfolioId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    positions: positionsQuery.data ?? [],
    isLoading: positionsQuery.isLoading,
  };
}

export function usePortfolioTransactions(portfolioId?: string | null) {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const token = accessToken;

  const addTransaction = useMutation({
    mutationFn: async (transaction: CreatePortfolioTransactionPayload) => {
      if (!user || !token) throw new Error("Sessão expirada. Entre novamente.");
      if (!portfolioId) throw new Error("Carteira ainda não carregada.");
      return apiRequest(`/portfolios/${portfolioId}/transactions`, {
        method: "POST",
        token,
        body: Object.fromEntries(
          Object.entries(transaction).map(([key, value]) => [
            key,
            typeof value === "number" ? toPlainDecimalString(value) : value,
          ]),
        ),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-positions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });

  return { addTransaction };
}

export function usePortfolioQuoteRefresh(portfolioId?: string | null) {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const token = accessToken;

  const refreshQuotes = useMutation({
    mutationFn: async () => {
      if (!user || !token) throw new Error("Sessão expirada. Entre novamente.");
      if (!portfolioId) throw new Error("Carteira ainda não carregada.");
      return apiRequest<{
        portfolioId: string;
        updatedCount: number;
        staleCount: number;
        incompleteCount: number;
      }>(`/portfolios/${portfolioId}/quotes/refresh`, {
        method: "POST",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-positions"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  return { refreshQuotes };
}

export function usePortfolioDividends(portfolioId?: string | null) {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const token = accessToken;

  const dividendsQuery = useQuery({
    queryKey: ["portfolio-dividends", user?.id, portfolioId],
    queryFn: async () => {
      if (!user || !token || !portfolioId) return [];
      const data = await apiRequest<ApiPortfolioDividendReceipt[]>(
        `/portfolios/${portfolioId}/dividends`,
        { token },
      );
      return data.map(mapPortfolioDividendReceipt);
    },
    enabled: !!user && !!token && !!portfolioId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const createDividend = useMutation({
    mutationFn: async (payload: CreateDividendPayload) => {
      if (!user || !token) throw new Error("Sessão expirada. Entre novamente.");
      if (!portfolioId) throw new Error("Carteira ainda não carregada.");
      const data = await apiRequest<ApiPortfolioDividendReceipt>(
        `/portfolios/${portfolioId}/dividends`,
        {
          method: "POST",
          token,
          body: Object.fromEntries(
            Object.entries(payload).map(([key, value]) => [
              key,
              typeof value === "number" ? toPlainDecimalString(value) : value,
            ]),
          ),
        },
      );
      return mapPortfolioDividendReceipt(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-dividends"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-monthly-report"] });
    },
  });

  const receiveDividend = useMutation({
    mutationFn: async ({ receiptId, ...payload }: ReceiveDividendPayload) => {
      if (!user || !token) throw new Error("Sessão expirada. Entre novamente.");
      if (!portfolioId) throw new Error("Carteira ainda não carregada.");
      const data = await apiRequest<ApiPortfolioDividendReceipt>(
        `/portfolios/${portfolioId}/dividends/${receiptId}/receive`,
        {
          method: "POST",
          token,
          body: Object.fromEntries(
            Object.entries(payload).map(([key, value]) => [
              key,
              typeof value === "number" ? toPlainDecimalString(value) : value,
            ]),
          ),
        },
      );
      return mapPortfolioDividendReceipt(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-dividends"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-positions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-monthly-report"] });
    },
  });

  return {
    dividends: dividendsQuery.data ?? [],
    isLoading: dividendsQuery.isLoading,
    createDividend,
    receiveDividend,
  };
}

export function usePortfolioMonthlyReport(
  portfolioId?: string | null,
  month?: string | null,
) {
  const { user, accessToken } = useAuth();
  const token = accessToken;

  const reportQuery = useQuery({
    queryKey: ["portfolio-monthly-report", user?.id, portfolioId, month],
    queryFn: async (): Promise<PortfolioMonthlyReport | null> => {
      if (!user || !token || !portfolioId || !month) return null;
      return apiRequest<ApiPortfolioMonthlyReport>(
        `/portfolios/${portfolioId}/reports/monthly?month=${encodeURIComponent(month)}`,
        { token },
      );
    },
    enabled: !!user && !!token && !!portfolioId && !!month,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    report: reportQuery.data ?? null,
    isLoading: reportQuery.isLoading,
  };
}
