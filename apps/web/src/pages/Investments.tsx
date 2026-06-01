import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  BadgeDollarSign,
  Coins,
  Loader2,
  RefreshCw,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssets } from "@/hooks/useAssets";
import { useAuth } from "@/hooks/useAuth";
import { useFormatter } from "@/hooks/useFormatter";
import {
  usePortfolioPositions,
  usePortfolioDividends,
  usePortfolioMonthlyReport,
  usePortfolioQuoteRefresh,
  usePortfolios,
  usePortfolioTransactions,
} from "@/hooks/usePortfolios";
import type {
  Asset,
  AssetClass,
  InvestmentAssetSearchResult,
  PortfolioDividendReceipt,
  PortfolioPosition,
  PortfolioTransactionType,
} from "@/types/finance";
import { toast } from "sonner";
import {
  AssetClassGroup,
  AssetDialog,
  AssetsTab,
  CalculationDialog,
  DividendDialog,
  DividendsTab,
  EmptyPanel,
  MonthlyReportTab,
  SummaryCard,
  TransactionDialog,
} from "@/features/investments/components";
import { assetClassMeta, pricedTransactionTypes } from "@/features/investments/constants";
import type { AssetFormState, DividendFormState, TransactionFormState } from "@/features/investments/types";
import {
  buildGroups,
  currentMonth,
  getErrorMessage,
  parseDecimal,
  today,
  toAssetClass,
} from "@/features/investments/utils";

export default function Investments() {
  const { user, loading } = useAuth();
  const { formatCurrency, formatNumber, formatPercent, formatDate } =
    useFormatter();
  const { assets, addAsset, lookupQuote, searchAssets } = useAssets();
  const { defaultPortfolio, isLoading: portfoliosLoading } = usePortfolios();
  const { positions, isLoading: positionsLoading } = usePortfolioPositions(
    defaultPortfolio?.id,
  );
  const { addTransaction } = usePortfolioTransactions(defaultPortfolio?.id);
  const { refreshQuotes } = usePortfolioQuoteRefresh(defaultPortfolio?.id);
  const {
    dividends,
    isLoading: dividendsLoading,
    createDividend,
    receiveDividend,
  } = usePortfolioDividends(defaultPortfolio?.id);
  const [reportMonth, setReportMonth] = useState(currentMonth());
  const { report, isLoading: reportLoading } = usePortfolioMonthlyReport(
    defaultPortfolio?.id,
    reportMonth,
  );

  const [activeTab, setActiveTab] = useState("portfolio");
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [dividendDialogOpen, setDividendDialogOpen] = useState(false);
  const [calculationDetails, setCalculationDetails] =
    useState<PortfolioPosition | null>(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetResults, setAssetResults] = useState<InvestmentAssetSearchResult[]>(
    [],
  );
  const [assetSearchLoading, setAssetSearchLoading] = useState(false);
  const [assetSearchError, setAssetSearchError] = useState<string | null>(null);
  const [transactionAssetClass, setTransactionAssetClass] =
    useState<AssetClass>("stock");
  const [transactionAssetSearch, setTransactionAssetSearch] = useState("");
  const [transactionAssetSearchLocked, setTransactionAssetSearchLocked] =
    useState(false);
  const [transactionAssetResults, setTransactionAssetResults] = useState<
    InvestmentAssetSearchResult[]
  >([]);
  const [transactionAssetSearchLoading, setTransactionAssetSearchLoading] =
    useState(false);
  const [transactionAssetSearchError, setTransactionAssetSearchError] = useState<
    string | null
  >(null);
  const [transactionQuoteLoading, setTransactionQuoteLoading] = useState(false);
  const [assetForm, setAssetForm] = useState<AssetFormState>({
    ticker: "",
    name: "",
    class: "stock" as AssetClass,
    sector: "",
    currency: "BRL",
    notes: "",
  });
  const [transactionForm, setTransactionForm] = useState<TransactionFormState>({
    assetId: "",
    type: "buy" as PortfolioTransactionType,
    quantity: "",
    unitPrice: "",
    totalAmount: "",
    fees: "0",
    taxes: "0",
    occurredAt: today(),
    notes: "",
  });
  const [dividendForm, setDividendForm] = useState<DividendFormState>({
    assetId: "",
    status: "announced",
    quantity: "",
    amountPerShare: "",
    taxes: "0",
    totalAmount: "",
    exDate: "",
    paymentDate: today(),
    notes: "",
  });

  const groups = useMemo(() => buildGroups(positions), [positions]);
  const portfolioSummary = useMemo(() => {
    const totalValue = positions.reduce(
      (total, position) => total + position.currentValue,
      0,
    );
    const totalCost = positions.reduce(
      (total, position) => total + position.costBasis,
      0,
    );
    const dividends = positions.reduce(
      (total, position) => total + position.dividends,
      0,
    );
    const capitalGain = positions.reduce(
      (total, position) => total + position.unrealizedGain,
      0,
    );
    const gain = capitalGain + dividends;

    return {
      totalValue,
      totalCost,
      dividends,
      capitalGain,
      gain,
      variation: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      profitability: totalCost > 0 ? (gain / totalCost) * 100 : 0,
    };
  }, [positions]);
  const allocationData = useMemo(
    () =>
      groups.map((group) => ({
        name: assetClassMeta[group.class].shortLabel,
        value: group.totalValue,
        weight: group.weight,
        color: assetClassMeta[group.class].color,
      })),
    [groups],
  );
  const barData = useMemo(
    () =>
      groups.map((group) => ({
        name: assetClassMeta[group.class].shortLabel,
        aplicado: group.totalCost,
        atual: group.totalValue,
      })),
    [groups],
  );

  const runAssetSearch = useCallback(
    async (
      query: string,
      assetClass: AssetClass,
      setResults: (results: InvestmentAssetSearchResult[]) => void,
      setLoading: (loading: boolean) => void,
      setError: (message: string | null) => void,
    ) => {
      if (query.trim().length < 2) {
        setResults([]);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        setResults(await searchAssets(query, assetClass));
      } catch (error) {
        setResults([]);
        setError(getErrorMessage(error, "Nao foi possivel buscar ativos"));
      } finally {
        setLoading(false);
      }
    },
    [searchAssets],
  );

  useEffect(() => {
    if (!assetDialogOpen) return;
    const query = assetSearch.trim();
    if (query.length < 2) {
      setAssetResults([]);
      setAssetSearchError(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      void runAssetSearch(
        query,
        assetForm.class,
        setAssetResults,
        setAssetSearchLoading,
        setAssetSearchError,
      );
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [assetDialogOpen, assetSearch, assetForm.class, runAssetSearch]);

  useEffect(() => {
    if (!transactionDialogOpen) return;
    if (transactionAssetSearchLocked) return;
    const query = transactionAssetSearch.trim();
    if (query.length < 2) {
      setTransactionAssetResults([]);
      setTransactionAssetSearchError(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      void runAssetSearch(
        query,
        transactionAssetClass,
        setTransactionAssetResults,
        setTransactionAssetSearchLoading,
        setTransactionAssetSearchError,
      );
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [
    transactionDialogOpen,
    transactionAssetSearch,
    transactionAssetSearchLocked,
    transactionAssetClass,
    runAssetSearch,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleRefreshQuotes = async () => {
    try {
      const result = await refreshQuotes.mutateAsync();
      toast.success(`${result.updatedCount} cotacoes atualizadas`);
      if (result.staleCount > 0) {
        toast.warning(`${result.staleCount} cotacoes continuam atrasadas`);
      }
      if (result.incompleteCount > 0) {
        toast.warning(`${result.incompleteCount} ativos seguem sem cotacao`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel atualizar cotacoes"));
    }
  };

  const handleAssetSearch = async () => {
    await runAssetSearch(
      assetSearch,
      assetForm.class,
      setAssetResults,
      setAssetSearchLoading,
      setAssetSearchError,
    );
  };

  const applyQuoteToTransaction = async (assetId: string, date: string) => {
    if (!assetId || !date) return;
    setTransactionQuoteLoading(true);
    try {
      const result = await lookupQuote.mutateAsync({ assetId, date });
      if (!result.quote) {
        toast.warning("Cotacao automatica nao encontrada para essa data");
        return;
      }
      const price = result.quote.price;
      setTransactionForm((current) => {
        const quantity = current.quantity ? parseDecimal(current.quantity) : 0;
        return {
          ...current,
          unitPrice: String(price),
          totalAmount:
            quantity > 0 ? String(Number((quantity * price).toFixed(8))) : current.totalAmount,
        };
      });
      if (result.fallback) {
        toast.warning(
          `Cotacao historica nao encontrada; usei ${
            result.fallback === "cached"
              ? "a ultima cotacao salva"
              : "a cotacao mais recente"
          }: ${formatCurrency(price)}`,
        );
      } else {
        toast.success(`Cotacao preenchida: ${formatCurrency(price)}`);
      }
    } catch (error) {
      toast.warning(
        getErrorMessage(
          error,
          "Cotacao automatica indisponivel. Informe o preco manualmente.",
        ),
      );
    } finally {
      setTransactionQuoteLoading(false);
    }
  };

  const handleTransactionAssetSearch = async () => {
    setTransactionAssetSearchLocked(false);
    await runAssetSearch(
      transactionAssetSearch,
      transactionAssetClass,
      setTransactionAssetResults,
      setTransactionAssetSearchLoading,
      setTransactionAssetSearchError,
    );
  };

  const handleSelectTransactionAsset = async (asset: Asset) => {
    setTransactionAssetSearch(`${asset.ticker} - ${asset.name}`);
    setTransactionAssetSearchLocked(true);
    setTransactionAssetClass(asset.class);
    setTransactionAssetResults([]);
    setTransactionAssetSearchError(null);
    setTransactionForm((current) => ({ ...current, assetId: asset.id }));
    if (pricedTransactionTypes.has(transactionForm.type)) {
      await applyQuoteToTransaction(asset.id, transactionForm.occurredAt);
    }
  };

  const handleCreateTransactionAssetFromSearch = async (
    result: InvestmentAssetSearchResult,
  ) => {
    try {
      const existing = assets.find(
        (asset) => asset.ticker.toUpperCase() === result.symbol.toUpperCase(),
      );
      const asset =
        existing ??
        (await addAsset.mutateAsync({
          ticker: result.symbol,
          name: result.name,
          class: toAssetClass(result.type),
          currency: result.currency,
        }));

      setTransactionAssetSearch(`${asset.ticker} - ${asset.name}`);
      setTransactionAssetSearchLocked(true);
      setTransactionAssetClass(asset.class);
      setTransactionAssetResults([]);
      setTransactionAssetSearchError(null);
      setTransactionForm((current) => ({ ...current, assetId: asset.id }));
      if (pricedTransactionTypes.has(transactionForm.type)) {
        await applyQuoteToTransaction(asset.id, transactionForm.occurredAt);
      }
      toast.success(existing ? "Ativo selecionado" : "Ativo cadastrado");
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel selecionar ativo"));
    }
  };

  const handleTransactionDateChange = async (date: string) => {
    const assetId = transactionForm.assetId;
    const type = transactionForm.type;
    setTransactionForm((current) => ({ ...current, occurredAt: date }));
    if (assetId && pricedTransactionTypes.has(type)) {
      await applyQuoteToTransaction(assetId, date);
    }
  };

  const handleTransactionTypeChange = async (type: PortfolioTransactionType) => {
    const assetId = transactionForm.assetId;
    const occurredAt = transactionForm.occurredAt;
    setTransactionForm((current) => ({ ...current, type }));
    if (assetId && pricedTransactionTypes.has(type)) {
      await applyQuoteToTransaction(assetId, occurredAt);
    }
  };

  const handleCreateAsset = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const asset = await addAsset.mutateAsync({
        ticker: assetForm.ticker,
        name: assetForm.name,
        class: assetForm.class,
        sector: assetForm.sector || null,
        currency: assetForm.currency || "BRL",
        notes: assetForm.notes || null,
      });
      setAssetForm({
        ticker: "",
        name: "",
        class: "stock",
        sector: "",
        currency: "BRL",
        notes: "",
      });
      setTransactionForm((current) => ({ ...current, assetId: asset.id }));
      setAssetDialogOpen(false);
      toast.success("Ativo cadastrado");
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel cadastrar ativo"));
    }
  };

  const handleCreateAssetFromSearch = async (
    result: InvestmentAssetSearchResult,
  ) => {
    try {
      const existing = assets.find(
        (asset) => asset.ticker.toUpperCase() === result.symbol.toUpperCase(),
      );
      const asset =
        existing ??
        (await addAsset.mutateAsync({
          ticker: result.symbol,
          name: result.name,
          class: toAssetClass(result.type),
          currency: result.currency,
        }));
      setTransactionForm((current) => ({ ...current, assetId: asset.id }));
      setAssetDialogOpen(false);
      setTransactionDialogOpen(true);
      toast.success(existing ? "Ativo selecionado" : "Ativo cadastrado");
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel cadastrar ativo"));
    }
  };

  const handleCreateDividend = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await createDividend.mutateAsync({
        assetId: dividendForm.assetId,
        status: dividendForm.status,
        quantity: dividendForm.quantity ? parseDecimal(dividendForm.quantity) : null,
        amountPerShare: parseDecimal(dividendForm.amountPerShare),
        taxes: dividendForm.taxes ? parseDecimal(dividendForm.taxes) : 0,
        totalAmount: dividendForm.totalAmount
          ? parseDecimal(dividendForm.totalAmount)
          : null,
        exDate: dividendForm.exDate || null,
        paymentDate: dividendForm.paymentDate,
        notes: dividendForm.notes || null,
      });
      setDividendForm({
        assetId: "",
        status: "announced",
        quantity: "",
        amountPerShare: "",
        taxes: "0",
        totalAmount: "",
        exDate: "",
        paymentDate: today(),
        notes: "",
      });
      setDividendDialogOpen(false);
      toast.success("Provento cadastrado");
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel cadastrar provento"));
    }
  };

  const handleReceiveDividend = async (receipt: PortfolioDividendReceipt) => {
    try {
      await receiveDividend.mutateAsync({
        receiptId: receipt.id,
        receivedAt: today(),
      });
      toast.success("Provento marcado como recebido");
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel receber provento"));
    }
  };

  const handleCreateTransaction = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await addTransaction.mutateAsync({
        assetId: transactionForm.assetId,
        type: transactionForm.type,
        quantity: transactionForm.quantity
          ? parseDecimal(transactionForm.quantity)
          : null,
        unitPrice: transactionForm.unitPrice
          ? parseDecimal(transactionForm.unitPrice)
          : null,
        totalAmount: transactionForm.totalAmount
          ? parseDecimal(transactionForm.totalAmount)
          : null,
        fees: transactionForm.fees ? parseDecimal(transactionForm.fees) : 0,
        taxes: transactionForm.taxes ? parseDecimal(transactionForm.taxes) : 0,
        occurredAt: transactionForm.occurredAt,
        notes: transactionForm.notes || null,
      });
      setTransactionForm((current) => ({
        ...current,
        quantity: "",
        unitPrice: "",
        totalAmount: "",
        fees: "0",
        taxes: "0",
        notes: "",
      }));
      setTransactionDialogOpen(false);
      toast.success("Evento registrado");
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel registrar evento"));
    }
  };

  const isBusy = portfoliosLoading || positionsLoading;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-4xl font-normal tracking-normal text-foreground">
              Investimentos
            </h1>
            <p className="text-sm text-muted-foreground">
              Carteira transacional organizada por classe de ativo.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleRefreshQuotes}
              disabled={refreshQuotes.isPending || !defaultPortfolio || positions.length === 0}
            >
              {refreshQuotes.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Atualizar cotacoes
            </Button>
            <AssetDialog
              open={assetDialogOpen}
              onOpenChange={setAssetDialogOpen}
              assetForm={assetForm}
              setAssetForm={setAssetForm}
              assetSearch={assetSearch}
              setAssetSearch={setAssetSearch}
              assetResults={assetResults}
              assetSearchLoading={assetSearchLoading}
              assetSearchError={assetSearchError}
              onSearch={handleAssetSearch}
              onCreateAsset={handleCreateAsset}
              onCreateAssetFromSearch={handleCreateAssetFromSearch}
              isCreating={addAsset.isPending}
            />
            <TransactionDialog
              open={transactionDialogOpen}
              onOpenChange={setTransactionDialogOpen}
              assets={assets}
              assetClass={transactionAssetClass}
              setAssetClass={setTransactionAssetClass}
              assetSearch={transactionAssetSearch}
              assetSearchLocked={transactionAssetSearchLocked}
              setAssetSearch={(value) => {
                setTransactionAssetSearch(value);
                setTransactionAssetSearchLocked(false);
              }}
              assetResults={transactionAssetResults}
              assetSearchLoading={transactionAssetSearchLoading}
              assetSearchError={transactionAssetSearchError}
              quoteLoading={transactionQuoteLoading}
              transactionForm={transactionForm}
              setTransactionForm={setTransactionForm}
              onAssetSearch={handleTransactionAssetSearch}
              onSelectAsset={handleSelectTransactionAsset}
              onCreateAssetFromSearch={handleCreateTransactionAssetFromSearch}
              onDateChange={handleTransactionDateChange}
              onTypeChange={handleTransactionTypeChange}
              onSubmit={handleCreateTransaction}
              isSubmitting={addTransaction.isPending || addAsset.isPending}
              canSubmit={!!defaultPortfolio && !portfoliosLoading}
            />
            <DividendDialog
              open={dividendDialogOpen}
              onOpenChange={setDividendDialogOpen}
              assets={assets}
              dividendForm={dividendForm}
              setDividendForm={setDividendForm}
              onSubmit={handleCreateDividend}
              isSubmitting={createDividend.isPending}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="grid h-auto w-full grid-cols-2 md:inline-grid md:w-auto md:grid-cols-4">
            <TabsTrigger value="portfolio">Carteira</TabsTrigger>
            <TabsTrigger value="assets">Ativos</TabsTrigger>
            <TabsTrigger value="dividends">Proventos</TabsTrigger>
            <TabsTrigger value="reports">Relatorios</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={WalletCards}
            label="Patrimonio total"
            value={formatCurrency(portfolioSummary.totalValue)}
            detail={`Valor investido ${formatCurrency(portfolioSummary.totalCost)}`}
            accent={portfolioSummary.gain >= 0 ? "positive" : "negative"}
            badge={formatPercent(portfolioSummary.variation, 2)}
          />
          <SummaryCard
            icon={Coins}
            label="Lucro total"
            value={formatCurrency(portfolioSummary.gain)}
            detail={`Capital ${formatCurrency(portfolioSummary.capitalGain)}`}
            secondDetail={`Proventos ${formatCurrency(portfolioSummary.dividends)}`}
            accent={portfolioSummary.gain >= 0 ? "positive" : "negative"}
          />
          <SummaryCard
            icon={BadgeDollarSign}
            label="Proventos recebidos"
            value={formatCurrency(portfolioSummary.dividends)}
            detail="Baseado nos eventos de dividendos registrados"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Rentabilidade"
            value={formatPercent(portfolioSummary.profitability, 2)}
            detail={`Variacao ${formatPercent(portfolioSummary.variation, 2)}`}
            accent={portfolioSummary.profitability >= 0 ? "positive" : "negative"}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.85fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Evolucao por classe</CardTitle>
              <Badge variant="outline">Carteira atual</Badge>
            </CardHeader>
            <CardContent>
              {barData.length === 0 ? (
                <EmptyPanel message="Registre uma compra para visualizar a evolucao da carteira." />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatCurrency(Number(value))}
                        width={90}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(Number(value))}
                        cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
                      />
                      <Bar dataKey="aplicado" fill="#64748b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="atual" fill="#19c37d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Ativos na carteira</CardTitle>
              <Badge variant="outline">{groups.length} classes</Badge>
            </CardHeader>
            <CardContent>
              {allocationData.length === 0 ? (
                <EmptyPanel message="A alocacao aparece quando houver posicoes." />
              ) : (
                <div className="grid min-h-80 grid-cols-1 items-center gap-4 md:grid-cols-[1fr_0.9fr] xl:grid-cols-1 2xl:grid-cols-[1fr_0.9fr]">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={96}
                          paddingAngle={2}
                        >
                          {allocationData.map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatCurrency(Number(value))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {allocationData.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}
                        </span>
                        <span className="font-medium">
                          {formatPercent(item.weight, 2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>Meus Ativos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {positions.length} ativos em {groups.length} classes
                </p>
              </div>
              <Badge variant="secondary">
                {defaultPortfolio?.name ?? "Carteira principal"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isBusy ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : positions.length === 0 ? (
              <EmptyPanel message="Cadastre um ativo e registre uma compra para montar a carteira." />
            ) : (
              <Accordion
                type="multiple"
                defaultValue={groups.slice(0, 2).map((group) => group.class)}
                className="space-y-4"
              >
                {groups.map((group) => (
                  <AssetClassGroup
                    key={group.class}
                    group={group}
                    totalPortfolioValue={portfolioSummary.totalValue}
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                    formatPercent={formatPercent}
                    formatDate={formatDate}
                    onShowCalculation={setCalculationDetails}
                  />
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <AssetsTab
              assets={assets}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          </TabsContent>

          <TabsContent value="dividends" className="space-y-4">
            <DividendsTab
              dividends={dividends}
              isLoading={dividendsLoading}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onReceive={handleReceiveDividend}
              isReceiving={receiveDividend.isPending}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <MonthlyReportTab
              month={reportMonth}
              setMonth={setReportMonth}
              report={report}
              isLoading={reportLoading}
              formatCurrency={formatCurrency}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CalculationDialog
        position={calculationDetails}
        onOpenChange={(open) => !open && setCalculationDetails(null)}
        formatCurrency={formatCurrency}
        formatNumber={formatNumber}
        formatDate={formatDate}
      />
    </AppLayout>
  );
}
