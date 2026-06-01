import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PortfolioPosition, QuoteStatus } from "@/types/finance";
import { assetClassMeta, quoteStatusLabels } from "../constants";
import type { PositionGroup } from "../types";

export function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  secondDetail,
  accent = "neutral",
  badge,
}: {
  icon: LucideIcon;
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

export function AssetClassGroup({
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

export function QuoteBadge({
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

export function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
