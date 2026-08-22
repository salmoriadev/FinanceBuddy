import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import {
  AlertCircle,
  CalendarDays,
  Coins,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import type {
  Asset,
  InvestmentAssetSearchResult,
  PortfolioPosition,
  PortfolioTransactionType,
} from "@/types/finance";
import {
  ASSET_CLASS_OPTIONS,
  assetClassMeta,
  assetClassOptionMeta,
  quoteStatusLabels,
  transactionLabels,
} from "../constants";
import type { AssetClassOption } from "../constants";
import type { AssetFormState, DividendFormState, TransactionFormState } from "../types";
import {
  assetMatchesClassOption,
  currencyForAssetClass,
  parseDecimal,
  toAssetClass,
  toPersistedAssetClass,
} from "../utils";

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
          Resultado alternativo. Confira o código e o preço antes de registrar.
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
              {result.price ? (
                <span className="block text-xs text-muted-foreground">
                  Último fechamento: {result.currency} {result.price.toLocaleString("pt-BR")}
                </span>
              ) : null}
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

export function AssetDialog({
  open,
  onOpenChange,
  assetForm,
  setAssetForm,
  assetSearch,
  assetSearchLocked = false,
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
  assetForm: AssetFormState;
  setAssetForm: Dispatch<SetStateAction<AssetFormState>>;
  assetSearch: string;
  assetSearchLocked?: boolean;
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
              placeholder="Buscar código, nome ou criptomoeda"
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
                placeholder="Código do ativo"
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
                onValueChange={(value) => {
                  const assetClass = value as AssetClassOption;
                  setAssetForm((current) => ({
                    ...current,
                    class: assetClass,
                    currency: currencyForAssetClass(assetClass, current.currency),
                    fixedIncomeIndexer:
                      assetClass === "fixed_income_usd"
                        ? "fixed"
                        : current.fixedIncomeIndexer,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CLASS_OPTIONS.map((assetClass) => (
                    <SelectItem key={assetClass} value={assetClass}>
                      {assetClassOptionMeta[assetClass].label}
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
                readOnly={
                  assetForm.class === "fixed_income_brl" ||
                  assetForm.class === "fixed_income_usd"
                }
              />
            </div>
            {toPersistedAssetClass(assetForm.class) === "fixed_income" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select
                  value={assetForm.fixedIncomeIndexer}
                  onValueChange={(value) =>
                    setAssetForm((current) => ({
                      ...current,
                      fixedIncomeIndexer: value as AssetFormState["fixedIncomeIndexer"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Prefixado</SelectItem>
                    {assetForm.currency === "BRL" && (
                      <>
                        <SelectItem value="ipca">IPCA + taxa</SelectItem>
                        <SelectItem value="cdi">Pós-fixado (% do CDI)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <Input
                  value={assetForm.fixedIncomeRate}
                  onChange={(event) =>
                    setAssetForm((current) => ({
                      ...current,
                      fixedIncomeRate: event.target.value,
                    }))
                  }
                  inputMode="decimal"
                  placeholder={
                    assetForm.fixedIncomeIndexer === "cdi"
                      ? "Percentual do CDI (ex.: 100)"
                      : assetForm.fixedIncomeIndexer === "ipca"
                        ? "Taxa adicional ao ano (ex.: 6,5)"
                        : "Taxa ao ano (ex.: 15)"
                  }
                  required
                />
              </div>
            )}
            <Textarea
              value={assetForm.notes}
              onChange={(event) =>
                setAssetForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Observações"
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

export function TransactionDialog({
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
  pendingAsset,
  onAssetSearch,
  onSelectAsset,
  onCreateAssetFromSearch,
  onDateChange,
  onTypeChange,
  onSubmit,
  isSubmitting,
  canSubmit,
  portfolioStatusMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
  assetClass: AssetClassOption;
  setAssetClass: (value: AssetClassOption) => void;
  assetSearch: string;
  assetSearchLocked: boolean;
  setAssetSearch: (value: string) => void;
  assetResults: InvestmentAssetSearchResult[];
  assetSearchLoading: boolean;
  assetSearchError: string | null;
  quoteLoading: boolean;
  transactionForm: TransactionFormState;
  setTransactionForm: Dispatch<SetStateAction<TransactionFormState>>;
  pendingAsset: InvestmentAssetSearchResult | null;
  onAssetSearch: () => void;
  onSelectAsset: (asset: Asset) => void;
  onCreateAssetFromSearch: (result: InvestmentAssetSearchResult) => void;
  onDateChange: (date: string) => void;
  onTypeChange: (type: PortfolioTransactionType) => void;
  onSubmit: (event: FormEvent) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  portfolioStatusMessage: string | null;
}) {
  const filteredAssets = assets.filter((asset) =>
    assetMatchesClassOption(asset, assetClass),
  );
  const isFixedIncome = toPersistedAssetClass(assetClass) === "fixed_income";
  const hasAsset = Boolean(
    transactionForm.assetId ||
      pendingAsset ||
      (isFixedIncome &&
        assetSearch.trim() &&
        transactionForm.fixedIncomeRate.trim() &&
        (transactionForm.fixedIncomeIndexer === "ipca"
          ? parseDecimal(transactionForm.fixedIncomeRate) >= 0
          : parseDecimal(transactionForm.fixedIncomeRate) > 0)),
  );
  const selectedAssetValue =
    transactionForm.assetId || (pendingAsset ? "__pending_asset__" : "");

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
                setAssetClass(value as AssetClassOption);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CLASS_OPTIONS.map((currentClass) => (
                  <SelectItem key={currentClass} value={currentClass}>
                    {assetClassOptionMeta[currentClass].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={assetSearch}
              onChange={(event) =>
                setAssetSearch(event.target.value.slice(0, isFixedIncome ? 80 : 32))
              }
              placeholder={
                isFixedIncome
                  ? "Identificação (ex.: CDB Banco X 2028)"
                  : "Buscar PETR4, HGLG11, IVVB11, BTC..."
              }
            />
            {!isFixedIncome && (
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
            )}
          </div>
          {!isFixedIncome && !assetSearchLocked && (
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
              value={selectedAssetValue}
              onValueChange={(value) => {
                if (value === "__pending_asset__") return;
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
                {pendingAsset && (
                  <SelectItem value="__pending_asset__">
                    {pendingAsset.symbol} - {pendingAsset.name} (novo)
                  </SelectItem>
                )}
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
          {isFixedIncome && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                value={transactionForm.fixedIncomeIndexer}
                disabled={Boolean(transactionForm.assetId)}
                onValueChange={(value) =>
                  setTransactionForm((current) => ({
                    ...current,
                    fixedIncomeIndexer: value as TransactionFormState["fixedIncomeIndexer"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Prefixado</SelectItem>
                  {assetClass !== "fixed_income_usd" && (
                    <>
                      <SelectItem value="ipca">IPCA + taxa</SelectItem>
                      <SelectItem value="cdi">Pós-fixado (% do CDI)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <Input
                value={transactionForm.fixedIncomeRate}
                disabled={Boolean(transactionForm.assetId)}
                onChange={(event) =>
                  setTransactionForm((current) => ({
                    ...current,
                    fixedIncomeRate: event.target.value,
                  }))
                }
                inputMode="decimal"
                placeholder={
                  transactionForm.fixedIncomeIndexer === "cdi"
                    ? "% do CDI (ex.: 100)"
                    : transactionForm.fixedIncomeIndexer === "ipca"
                      ? "Taxa adicional a.a. (ex.: 6,5)"
                      : "Taxa a.a. (ex.: 15)"
                }
                required={!transactionForm.assetId}
              />
            </div>
          )}
          {!isFixedIncome ? (
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
              placeholder="Preço unitário"
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
          ) : (
            <Input
              value={transactionForm.totalAmount}
              onChange={(event) =>
                setTransactionForm((current) => ({
                  ...current,
                  totalAmount: event.target.value,
                }))
              }
              inputMode="decimal"
              placeholder={
                transactionForm.type === "sell"
                  ? "Valor bruto resgatado"
                  : "Valor aplicado"
              }
              required
            />
          )}
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
            placeholder="Observações"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !hasAsset || !canSubmit}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar evento
            </Button>
            {!canSubmit && portfolioStatusMessage && (
              <span className="text-sm text-muted-foreground">
                {portfolioStatusMessage}
              </span>
            )}
            {quoteLoading && (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando cotação da data
              </span>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DividendDialog({
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
            placeholder="Observações"
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

export function CalculationDialog({
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
                label="Preço médio"
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
              <p className="font-medium">Cotação</p>
              <p className="text-muted-foreground">
                Fonte: {position.audit.quoteSource ?? "sem fonte"} / Situação:{" "}
                {quoteStatusLabels[position.audit.quoteStatus]}
              </p>
              {position.audit.quotedAt && (
                <p className="text-muted-foreground">
                  Horário: {formatDate(position.audit.quotedAt)}
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
