import {
  AlertCircle,
  BadgeDollarSign,
  CheckCircle2,
  Coins,
  Loader2,
  PieChart as PieChartIcon,
  TrendingUp,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Asset, PortfolioDividendReceipt, PortfolioMonthlyReport } from "@/types/finance";
import { assetClassOptionMeta, dividendStatusLabels } from "../constants";
import { classOptionForAsset } from "../utils";
import { EmptyPanel, QuoteBadge } from "./shared";

export function AssetsTab({
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
                  <TableCell>
                    {assetClassOptionMeta[classOptionForAsset(asset)].label}
                  </TableCell>
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

export function DividendsTab({
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

export function MonthlyReportTab({
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
  icon: LucideIcon;
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
