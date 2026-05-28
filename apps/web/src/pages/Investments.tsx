import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Navigate } from "react-router-dom";
import {
  AlertCircle,
  BadgeDollarSign,
  Bitcoin,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Coins,
  Landmark,
  Loader2,
  MoreHorizontal,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Search,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Asset,
  AssetClass,
  InvestmentAssetSearchResult,
  PortfolioDividendReceipt,
  PortfolioMonthlyReport,
  PortfolioPosition,
  PortfolioTransactionType,
  QuoteStatus,
} from "@/types/finance";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ASSET_CLASSES: AssetClass[] = [
  "stock",
  "fii",
  "etf",
  "bdr",
  "crypto",
  "fixed_income",
  "custom",
];

const assetClassMeta: Record<
  AssetClass,
  {
    label: string;
    shortLabel: string;
    color: string;
    icon: typeof BriefcaseBusiness;
  }
> = {
  stock: {
    label: "Acoes",
    shortLabel: "Acoes",
    color: "#6ee7a8",
    icon: BadgeDollarSign,
  },
  fii: {
    label: "FIIs",
    shortLabel: "FIIs",
    color: "#fb7185",
    icon: Building2,
  },
  etf: {
    label: "ETFs",
    shortLabel: "ETFs",
    color: "#22c55e",
    icon: PieChartIcon,
  },
  bdr: {
    label: "BDRs",
    shortLabel: "BDRs",
    color: "#67e8f9",
    icon: BriefcaseBusiness,
  },
  crypto: {
    label: "Criptomoedas",
    shortLabel: "Criptos",
    color: "#fde047",
    icon: Bitcoin,
  },
  fixed_income: {
    label: "Renda Fixa",
    shortLabel: "Renda Fixa",
    color: "#60a5fa",
    icon: Landmark,
  },
  custom: {
    label: "Outros",
    shortLabel: "Outros",
    color: "#a78bfa",
    icon: WalletCards,
  },
};

const transactionLabels: Record<PortfolioTransactionType, string> = {
  buy: "Compra",
  sell: "Venda",
  dividend: "Provento",
  fee: "Taxa",
  manual_adjustment: "Ajuste manual",
  opening_balance: "Saldo inicial",
};

const pricedTransactionTypes = new Set<PortfolioTransactionType>([
  "buy",
  "sell",
  "opening_balance",
]);

const quoteStatusLabels: Record<QuoteStatus, string> = {
  current: "Atualizada",
  stale: "Atrasada",
  manual: "Manual",
  estimated: "Estimada",
  incomplete: "Sem cotacao",
};

const dividendStatusLabels: Record<PortfolioDividendReceipt["status"], string> = {
  pending: "Pendente",
  received: "Recebido",
  cancelled: "Cancelado",
};

type PositionGroup = {
  class: AssetClass;
  positions: PortfolioPosition[];
  totalValue: number;
  totalCost: number;
  gain: number;
  dividends: number;
  weight: number;
  variation: number;
  profitability: number;
};

type AssetFormState = {
  ticker: string;
  name: string;
  class: AssetClass;
  sector: string;
  currency: string;
  notes: string;
};

type TransactionFormState = {
  assetId: string;
  type: PortfolioTransactionType;
  quantity: string;
  unitPrice: string;
  totalAmount: string;
  fees: string;
  taxes: string;
  occurredAt: string;
  notes: string;
};

type DividendFormState = {
  assetId: string;
  status: "announced" | "confirmed";
  quantity: string;
  amountPerShare: string;
  taxes: string;
  totalAmount: string;
  exDate: string;
  paymentDate: string;
  notes: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => new Date().toISOString().slice(0, 7);

const parseDecimal = (value: string) => {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return fallback;
};

const toAssetClass = (value: string | undefined): AssetClass => {
  if (value && ASSET_CLASSES.includes(value as AssetClass)) {
    return value as AssetClass;
  }
  return "custom";
};

const buildGroups = (positions: PortfolioPosition[]): PositionGroup[] => {
  const totalPortfolioValue = positions.reduce(
    (total, position) => total + position.currentValue,
    0,
  );
  const groups = new Map<AssetClass, PortfolioPosition[]>();

  for (const position of positions) {
    const current = groups.get(position.asset.class) ?? [];
    groups.set(position.asset.class, [...current, position]);
  }

  return ASSET_CLASSES.map((assetClass) => {
    const classPositions = groups.get(assetClass) ?? [];
    const totalValue = classPositions.reduce(
      (total, position) => total + position.currentValue,
      0,
    );
    const totalCost = classPositions.reduce(
      (total, position) => total + position.costBasis,
      0,
    );
    const dividends = classPositions.reduce(
      (total, position) => total + position.dividends,
      0,
    );
    const gain = classPositions.reduce(
      (total, position) => total + position.unrealizedGain + position.dividends,
      0,
    );

    return {
      class: assetClass,
      positions: classPositions.sort((a, b) => b.currentValue - a.currentValue),
      totalValue,
      totalCost,
      gain,
      dividends,
      weight: totalPortfolioValue > 0 ? (totalValue / totalPortfolioValue) * 100 : 0,
      variation: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      profitability: totalCost > 0 ? (gain / totalCost) * 100 : 0,
    };
  }).filter((group) => group.positions.length > 0);
};

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

function AssetsTab({
  assets,
  formatCurrency,
  formatDate,
}: {
  assets: Asset[];
  formatCurrency: (value: number) => string;
  formatDate: (value: string | Date) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ativos cadastrados</CardTitle>
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <EmptyPanel message="Os ativos cadastrados aparecem aqui." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Cotacao</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-semibold">{asset.ticker}</TableCell>
                  <TableCell>{assetClassMeta[asset.class].label}</TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell className="text-right">
                    {asset.latest_quote
                      ? formatCurrency(asset.latest_quote.price)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <QuoteBadge
                      status={asset.latest_quote?.status ?? asset.status}
                      quotedAt={asset.latest_quote?.quoted_at ?? asset.observed_at}
                      formatDate={formatDate}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function DividendsTab({
  dividends,
  isLoading,
  formatCurrency,
  formatDate,
  onReceive,
  isReceiving,
}: {
  dividends: PortfolioDividendReceipt[];
  isLoading: boolean;
  formatCurrency: (value: number) => string;
  formatDate: (value: string | Date) => string;
  onReceive: (receipt: PortfolioDividendReceipt) => void;
  isReceiving: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Proventos</CardTitle>
          <Badge variant="outline">
            {dividends.filter((dividend) => dividend.status === "pending").length} pendentes
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : dividends.length === 0 ? (
          <EmptyPanel message="Cadastre um provento manual para acompanhar recebimentos." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ativo</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor por cota</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dividends.map((dividend) => (
                <TableRow key={dividend.id}>
                  <TableCell>
                    <div className="font-semibold">{dividend.asset.ticker}</div>
                    <div className="text-xs text-muted-foreground">
                      {dividend.asset.name}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(dividend.payment_date)}</TableCell>
                  <TableCell>
                    <Badge variant={dividend.status === "received" ? "secondary" : "outline"}>
                      {dividendStatusLabels[dividend.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(dividend.amount_per_share)}
                  </TableCell>
                  <TableCell className="text-right">
                    {dividend.total_amount === null
                      ? "-"
                      : formatCurrency(dividend.total_amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={dividend.status === "received" || isReceiving}
                      onClick={() => onReceive(dividend)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Receber
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MonthlyReportTab({
  month,
  setMonth,
  report,
  isLoading,
  formatCurrency,
}: {
  month: string;
  setMonth: (month: string) => void;
  report: PortfolioMonthlyReport | null;
  isLoading: boolean;
  formatCurrency: (value: number) => string;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Relatorio mensal</CardTitle>
          <Input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-full sm:w-48"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !report ? (
            <EmptyPanel message="Selecione um mes para gerar o relatorio." />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <ReportMetric
                  icon={BadgeDollarSign}
                  label="Aportes"
                  value={formatCurrency(report.contributions)}
                />
                <ReportMetric
                  icon={WalletCards}
                  label="Vendas"
                  value={formatCurrency(report.sales)}
                />
                <ReportMetric
                  icon={Coins}
                  label="Proventos"
                  value={formatCurrency(report.dividendsReceived)}
                />
                <ReportMetric
                  icon={TrendingUp}
                  label="Ganho estimado"
                  value={formatCurrency(report.estimatedCapitalGain)}
                />
                <ReportMetric
                  icon={PieChartIcon}
                  label="Patrimonio"
                  value={formatCurrency(report.portfolioValue)}
                />
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center gap-2 font-medium">
                  {report.pendingData.hasPendingData ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-[#19c37d]" />
                  )}
                  Dados pendentes
                </div>
                <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                  <p>Cotacoes atrasadas: {report.pendingData.staleQuotes}</p>
                  <p>Cotacoes ausentes: {report.pendingData.missingQuotes}</p>
                  <p>Proventos pendentes: {report.pendingData.pendingDividends}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReportMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof WalletCards;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="font-serif text-2xl tracking-normal">{value}</p>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  secondDetail,
  accent = "neutral",
  badge,
}: {
  icon: typeof WalletCards;
  label: string;
  value: string;
  detail: string;
  secondDetail?: string;
  accent?: "positive" | "negative" | "neutral";
  badge?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </span>
          <p className="font-medium text-muted-foreground">{label}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p
            className={cn(
              "font-serif text-3xl font-normal tracking-normal",
              accent === "positive" && "text-[#19c37d]",
              accent === "negative" && "text-[#ef6f7c]",
            )}
          >
            {value}
          </p>
          {badge && (
            <Badge
              variant="secondary"
              className={cn(
                accent === "positive" && "bg-[#19c37d]/15 text-[#19c37d]",
                accent === "negative" && "bg-[#ef6f7c]/15 text-[#ef6f7c]",
              )}
            >
              {badge}
            </Badge>
          )}
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          <p>{detail}</p>
          {secondDetail && <p>{secondDetail}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function AssetClassGroup({
  group,
  totalPortfolioValue,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  onShowCalculation,
}: {
  group: PositionGroup;
  totalPortfolioValue: number;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
  formatPercent: (value: number, digits?: number) => string;
  formatDate: (value: string | Date) => string;
  onShowCalculation: (position: PortfolioPosition) => void;
}) {
  const meta = assetClassMeta[group.class];
  const Icon = meta.icon;

  return (
    <AccordionItem
      value={group.class}
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <AccordionTrigger className="px-5 py-5 hover:no-underline">
        <div className="grid w-full grid-cols-1 gap-4 text-left lg:grid-cols-[1.2fr_repeat(5,0.72fr)] lg:items-center">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background">
              <Icon className="h-5 w-5" style={{ color: meta.color }} />
            </span>
            <div>
              <p className="text-xl font-semibold">{meta.label}</p>
              <p className="text-sm text-muted-foreground">
                {group.positions.length} ativos
              </p>
            </div>
          </div>
          <GroupMetric label="Valor total" value={formatCurrency(group.totalValue)} />
          <GroupMetric
            label="Variacao"
            value={formatPercent(group.variation, 2)}
            tone={group.variation >= 0 ? "positive" : "negative"}
          />
          <GroupMetric
            label="Rentabilidade"
            value={formatPercent(group.profitability, 2)}
            tone={group.profitability >= 0 ? "positive" : "negative"}
          />
          <GroupMetric label="% na carteira" value={formatPercent(group.weight, 2)} />
          <GroupMetric label="Proventos" value={formatCurrency(group.dividends)} />
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Quant.</TableHead>
              <TableHead className="text-right">Preco Medio</TableHead>
              <TableHead className="text-right">Preco Atual</TableHead>
              <TableHead className="text-right">Variacao</TableHead>
              <TableHead className="text-right">Rentabilidade</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right">% Carteira</TableHead>
              <TableHead>Cotacao</TableHead>
              <TableHead className="text-right">Opcoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.positions.map((position) => {
              const price = position.latestQuote?.price ?? null;
              const variation =
                position.costBasis > 0
                  ? (position.unrealizedGain / position.costBasis) * 100
                  : 0;
              const weight =
                totalPortfolioValue > 0
                  ? (position.currentValue / totalPortfolioValue) * 100
                  : 0;

              return (
                <TableRow key={position.asset.id}>
                  <TableCell>
                    <div>
                      <div className="font-semibold">{position.asset.ticker}</div>
                      <div className="max-w-[220px] truncate text-xs text-muted-foreground">
                        {position.asset.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(position.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(position.averagePrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {price === null ? "-" : formatCurrency(price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <TonePill value={formatPercent(variation, 2)} tone={variation >= 0 ? "positive" : "negative"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <TonePill
                      value={formatPercent(position.roi, 2)}
                      tone={position.roi >= 0 ? "positive" : "negative"}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(position.currentValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(weight, 2)}
                  </TableCell>
                  <TableCell>
                    <QuoteBadge
                      status={position.audit.quoteStatus}
                      quotedAt={position.audit.quotedAt}
                      formatDate={formatDate}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onShowCalculation(position)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AccordionContent>
    </AccordionItem>
  );
}

function GroupMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-base font-semibold",
          tone === "positive" && "text-[#19c37d]",
          tone === "negative" && "text-[#ef6f7c]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TonePill({
  value,
  tone,
}: {
  value: string;
  tone: "positive" | "negative";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[76px] justify-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "positive"
          ? "bg-[#19c37d]/15 text-[#19c37d]"
          : "bg-[#ef6f7c]/15 text-[#ef6f7c]",
      )}
    >
      {value}
    </span>
  );
}

function QuoteBadge({
  status,
  quotedAt,
  formatDate,
}: {
  status: QuoteStatus;
  quotedAt: string | null;
  formatDate: (value: string | Date) => string;
}) {
  const tone =
    status === "current" || status === "manual"
      ? "bg-[#19c37d]/15 text-[#19c37d]"
      : status === "stale"
        ? "bg-yellow-500/15 text-yellow-500"
        : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-1">
      <Badge variant="secondary" className={tone}>
        {quoteStatusLabels[status]}
      </Badge>
      {quotedAt && (
        <p className="text-xs text-muted-foreground">{formatDate(quotedAt)}</p>
      )}
    </div>
  );
}

function SearchResultsPanel({
  query,
  results,
  isLoading,
  error,
  onSelect,
}: {
  query: string;
  results: InvestmentAssetSearchResult[];
  isLoading: boolean;
  error: string | null;
  onSelect: (result: InvestmentAssetSearchResult) => void;
}) {
  const normalizedQuery = query.trim();
  const hasFallback = results.some((result) => result.provider === "mock");

  if (normalizedQuery.length < 2) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Buscando ativos
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
        Nenhum ativo encontrado para "{normalizedQuery}".
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hasFallback && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
          Resultado de fallback. Confira ticker e preco antes de registrar.
        </div>
      )}
      <div className="max-h-52 space-y-2 overflow-auto rounded-lg border border-border p-2">
        {results.map((result) => (
          <button
            key={`${result.provider}-${result.symbol}`}
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-md p-3 text-left transition hover:bg-muted"
            onClick={() => onSelect(result)}
          >
            <span>
              <span className="block font-semibold">{result.symbol}</span>
              <span className="block text-xs text-muted-foreground">
                {result.name}
              </span>
            </span>
            <Badge variant="outline">
              {assetClassMeta[toAssetClass(result.type)].label}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}

function AssetDialog({
  open,
  onOpenChange,
  assetForm,
  setAssetForm,
  assetSearch,
  assetSearchLocked,
  setAssetSearch,
  assetResults,
  assetSearchLoading,
  assetSearchError,
  onSearch,
  onCreateAsset,
  onCreateAssetFromSearch,
  isCreating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetForm: {
    ticker: string;
    name: string;
    class: AssetClass;
    sector: string;
    currency: string;
    notes: string;
  };
  setAssetForm: Dispatch<SetStateAction<AssetFormState>>;
  assetSearch: string;
  assetSearchLocked: boolean;
  setAssetSearch: (value: string) => void;
  assetResults: InvestmentAssetSearchResult[];
  assetSearchLoading: boolean;
  assetSearchError: string | null;
  onSearch: () => void;
  onCreateAsset: (event: FormEvent) => void;
  onCreateAssetFromSearch: (result: InvestmentAssetSearchResult) => void;
  isCreating: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Search className="mr-2 h-4 w-4" />
          Ativos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastrar ativo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={assetSearch}
              onChange={(event) => setAssetSearch(event.target.value.slice(0, 32))}
              placeholder="Buscar ticker, nome ou cripto"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onSearch}
              disabled={assetSearchLoading}
            >
              {assetSearchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!assetSearchLocked && (
            <SearchResultsPanel
              query={assetSearch}
              results={assetResults}
              isLoading={assetSearchLoading}
              error={assetSearchError}
              onSelect={onCreateAssetFromSearch}
            />
          )}
          <form onSubmit={onCreateAsset} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                value={assetForm.ticker}
                onChange={(event) =>
                  setAssetForm((current) => ({
                    ...current,
                    ticker: event.target.value,
                  }))
                }
                placeholder="Ticker"
                required
              />
              <Input
                value={assetForm.name}
                onChange={(event) =>
                  setAssetForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Nome"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Select
                value={assetForm.class}
                onValueChange={(value) =>
                  setAssetForm((current) => ({
                    ...current,
                    class: value as AssetClass,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CLASSES.map((assetClass) => (
                    <SelectItem key={assetClass} value={assetClass}>
                      {assetClassMeta[assetClass].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={assetForm.sector}
                onChange={(event) =>
                  setAssetForm((current) => ({ ...current, sector: event.target.value }))
                }
                placeholder="Setor"
              />
              <Input
                value={assetForm.currency}
                onChange={(event) =>
                  setAssetForm((current) => ({
                    ...current,
                    currency: event.target.value,
                  }))
                }
                placeholder="Moeda"
              />
            </div>
            <Textarea
              value={assetForm.notes}
              onChange={(event) =>
                setAssetForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Notas"
            />
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Cadastrar ativo manual
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransactionDialog({
  open,
  onOpenChange,
  assets,
  assetClass,
  setAssetClass,
  assetSearch,
  assetSearchLocked,
  setAssetSearch,
  assetResults,
  assetSearchLoading,
  assetSearchError,
  quoteLoading,
  transactionForm,
  setTransactionForm,
  onAssetSearch,
  onSelectAsset,
  onCreateAssetFromSearch,
  onDateChange,
  onTypeChange,
  onSubmit,
  isSubmitting,
  canSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
  assetClass: AssetClass;
  setAssetClass: (value: AssetClass) => void;
  assetSearch: string;
  assetSearchLocked: boolean;
  setAssetSearch: (value: string) => void;
  assetResults: InvestmentAssetSearchResult[];
  assetSearchLoading: boolean;
  assetSearchError: string | null;
  quoteLoading: boolean;
  transactionForm: {
    assetId: string;
    type: PortfolioTransactionType;
    quantity: string;
    unitPrice: string;
    totalAmount: string;
    fees: string;
    taxes: string;
    occurredAt: string;
    notes: string;
  };
  setTransactionForm: Dispatch<SetStateAction<TransactionFormState>>;
  onAssetSearch: () => void;
  onSelectAsset: (asset: Asset) => void;
  onCreateAssetFromSearch: (result: InvestmentAssetSearchResult) => void;
  onDateChange: (date: string) => void;
  onTypeChange: (type: PortfolioTransactionType) => void;
  onSubmit: (event: FormEvent) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}) {
  const filteredAssets = assets.filter((asset) => asset.class === assetClass);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo evento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar evento da carteira</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[0.7fr_1fr_auto]">
            <Select
              value={assetClass}
              onValueChange={(value) => {
                setAssetClass(value as AssetClass);
                setTransactionForm((current) => ({ ...current, assetId: "" }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CLASSES.map((currentClass) => (
                  <SelectItem key={currentClass} value={currentClass}>
                    {assetClassMeta[currentClass].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={assetSearch}
              onChange={(event) => setAssetSearch(event.target.value.slice(0, 32))}
              placeholder="Buscar PETR4, HGLG11, IVVB11, BTC..."
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onAssetSearch}
              disabled={assetSearchLoading}
            >
              {assetSearchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!assetSearchLocked && (
            <SearchResultsPanel
              query={assetSearch}
              results={assetResults}
              isLoading={assetSearchLoading}
              error={assetSearchError}
              onSelect={onCreateAssetFromSearch}
            />
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              value={transactionForm.assetId}
              onValueChange={(value) => {
                const asset = assets.find((item) => item.id === value);
                if (asset) {
                  onSelectAsset(asset);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ativo" />
              </SelectTrigger>
              <SelectContent>
                {filteredAssets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.ticker} - {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={transactionForm.type}
              onValueChange={(value) =>
                onTypeChange(value as PortfolioTransactionType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(transactionLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              value={transactionForm.quantity}
              onChange={(event) =>
                setTransactionForm((current) => {
                  const quantity = parseDecimal(event.target.value);
                  const unitPrice = current.unitPrice
                    ? parseDecimal(current.unitPrice)
                    : 0;
                  return {
                    ...current,
                    quantity: event.target.value,
                    totalAmount:
                      quantity > 0 && unitPrice > 0
                        ? String(Number((quantity * unitPrice).toFixed(8)))
                        : current.totalAmount,
                  };
                })
              }
              inputMode="decimal"
              placeholder="Quantidade"
            />
            <Input
              value={transactionForm.unitPrice}
              onChange={(event) =>
                setTransactionForm((current) => {
                  const quantity = current.quantity
                    ? parseDecimal(current.quantity)
                    : 0;
                  const unitPrice = parseDecimal(event.target.value);
                  return {
                    ...current,
                    unitPrice: event.target.value,
                    totalAmount:
                      quantity > 0 && unitPrice > 0
                        ? String(Number((quantity * unitPrice).toFixed(8)))
                        : current.totalAmount,
                  };
                })
              }
              inputMode="decimal"
              placeholder="Preco unitario"
            />
            <Input
              value={transactionForm.totalAmount}
              onChange={(event) =>
                setTransactionForm((current) => ({
                  ...current,
                  totalAmount: event.target.value,
                }))
              }
              inputMode="decimal"
              placeholder="Valor total"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              value={transactionForm.fees}
              onChange={(event) =>
                setTransactionForm((current) => ({
                  ...current,
                  fees: event.target.value,
                }))
              }
              inputMode="decimal"
              placeholder="Taxas"
            />
            <Input
              value={transactionForm.taxes}
              onChange={(event) =>
                setTransactionForm((current) => ({
                  ...current,
                  taxes: event.target.value,
                }))
              }
              inputMode="decimal"
              placeholder="Impostos"
            />
            <DateInput
              value={transactionForm.occurredAt}
              onChange={(event) => onDateChange(event.target.value)}
            />
          </div>
          <Textarea
            value={transactionForm.notes}
            onChange={(event) =>
              setTransactionForm((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            placeholder="Notas"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !transactionForm.assetId || !canSubmit}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar evento
            </Button>
            {!canSubmit && (
              <span className="text-sm text-muted-foreground">
                Carregando carteira
              </span>
            )}
            {quoteLoading && (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando cotacao da data
              </span>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DividendDialog({
  open,
  onOpenChange,
  assets,
  dividendForm,
  setDividendForm,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
  dividendForm: DividendFormState;
  setDividendForm: Dispatch<SetStateAction<DividendFormState>>;
  onSubmit: (event: FormEvent) => void;
  isSubmitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Coins className="mr-2 h-4 w-4" />
          Provento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastrar provento</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              value={dividendForm.assetId}
              onValueChange={(value) =>
                setDividendForm((current) => ({ ...current, assetId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Ativo" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.ticker} - {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={dividendForm.status}
              onValueChange={(value) =>
                setDividendForm((current) => ({
                  ...current,
                  status: value as DividendFormState["status"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="announced">Anunciado</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              value={dividendForm.quantity}
              onChange={(event) =>
                setDividendForm((current) => {
                  const quantity = parseDecimal(event.target.value);
                  const amountPerShare = current.amountPerShare
                    ? parseDecimal(current.amountPerShare)
                    : 0;
                  return {
                    ...current,
                    quantity: event.target.value,
                    totalAmount:
                      quantity > 0 && amountPerShare > 0
                        ? String(Number((quantity * amountPerShare).toFixed(8)))
                        : current.totalAmount,
                  };
                })
              }
              inputMode="decimal"
              placeholder="Quantidade"
            />
            <Input
              value={dividendForm.amountPerShare}
              onChange={(event) =>
                setDividendForm((current) => {
                  const quantity = current.quantity ? parseDecimal(current.quantity) : 0;
                  const amountPerShare = parseDecimal(event.target.value);
                  return {
                    ...current,
                    amountPerShare: event.target.value,
                    totalAmount:
                      quantity > 0 && amountPerShare > 0
                        ? String(Number((quantity * amountPerShare).toFixed(8)))
                        : current.totalAmount,
                  };
                })
              }
              inputMode="decimal"
              placeholder="Valor por cota"
              required
            />
            <Input
              value={dividendForm.totalAmount}
              onChange={(event) =>
                setDividendForm((current) => ({
                  ...current,
                  totalAmount: event.target.value,
                }))
              }
              inputMode="decimal"
              placeholder="Total previsto"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              value={dividendForm.taxes}
              onChange={(event) =>
                setDividendForm((current) => ({
                  ...current,
                  taxes: event.target.value,
                }))
              }
              inputMode="decimal"
              placeholder="Impostos"
            />
            <DateInput
              value={dividendForm.exDate}
              onChange={(event) =>
                setDividendForm((current) => ({
                  ...current,
                  exDate: event.target.value,
                }))
              }
            />
            <DateInput
              value={dividendForm.paymentDate}
              onChange={(event) =>
                setDividendForm((current) => ({
                  ...current,
                  paymentDate: event.target.value,
                }))
              }
            />
          </div>
          <Textarea
            value={dividendForm.notes}
            onChange={(event) =>
              setDividendForm((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            placeholder="Notas"
          />
          <Button type="submit" disabled={isSubmitting || !dividendForm.assetId}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarDays className="mr-2 h-4 w-4" />
            )}
            Cadastrar provento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CalculationDialog({
  position,
  onOpenChange,
  formatCurrency,
  formatNumber,
  formatDate,
}: {
  position: PortfolioPosition | null;
  onOpenChange: (open: boolean) => void;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
  formatDate: (value: string | Date) => string;
}) {
  return (
    <Dialog open={!!position} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {position?.asset.ticker} - Como foi calculado
          </DialogTitle>
        </DialogHeader>
        {position && (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg bg-muted/50 p-4 text-muted-foreground">
              {position.audit.formula}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Quantidade" value={formatNumber(position.quantity)} />
              <Detail
                label="Preco medio"
                value={formatCurrency(position.averagePrice)}
              />
              <Detail label="Custo" value={formatCurrency(position.costBasis)} />
              <Detail
                label="Valor atual"
                value={formatCurrency(position.currentValue)}
              />
              <Detail
                label="Proventos"
                value={formatCurrency(position.dividends)}
              />
              <Detail
                label="Eventos usados"
                value={String(position.audit.eventCount)}
              />
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium">Cotacao</p>
              <p className="text-muted-foreground">
                Fonte: {position.audit.quoteSource ?? "sem fonte"} / Status:{" "}
                {quoteStatusLabels[position.audit.quoteStatus]}
              </p>
              {position.audit.quotedAt && (
                <p className="text-muted-foreground">
                  Horario: {formatDate(position.audit.quotedAt)}
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
