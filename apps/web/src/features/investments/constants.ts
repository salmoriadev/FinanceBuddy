import {
  BadgeDollarSign,
  Bitcoin,
  BriefcaseBusiness,
  Building2,
  Landmark,
  PieChart as PieChartIcon,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type {
  AssetClass,
  PortfolioDividendReceipt,
  PortfolioTransactionType,
  QuoteStatus,
} from "@/types/finance";

export const ASSET_CLASSES: AssetClass[] = [
  "stock",
  "fii",
  "etf",
  "bdr",
  "crypto",
  "fixed_income",
  "custom",
];

export type AssetClassOption =
  | AssetClass
  | "fixed_income_brl"
  | "fixed_income_usd";

export const ASSET_CLASS_OPTIONS: AssetClassOption[] = [
  "stock",
  "fii",
  "etf",
  "bdr",
  "crypto",
  "fixed_income",
  "fixed_income_brl",
  "fixed_income_usd",
  "custom",
];

export const assetClassMeta: Record<
  AssetClass,
  {
    label: string;
    shortLabel: string;
    color: string;
    icon: LucideIcon;
  }
> = {
  stock: {
    label: "Ações",
    shortLabel: "Ações",
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
    label: "Renda fixa",
    shortLabel: "Renda fixa",
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

export const assetClassOptionMeta: Record<
  AssetClassOption,
  (typeof assetClassMeta)[AssetClass]
> = {
  ...assetClassMeta,
  fixed_income_brl: {
    label: "Renda fixa em real",
    shortLabel: "Renda fixa (R$)",
    color: "#38bdf8",
    icon: Landmark,
  },
  fixed_income_usd: {
    label: "Renda fixa em dólar",
    shortLabel: "Renda fixa (US$)",
    color: "#818cf8",
    icon: Landmark,
  },
};

export const transactionLabels: Record<PortfolioTransactionType, string> = {
  buy: "Compra",
  sell: "Venda",
  dividend: "Provento",
  fee: "Taxa",
  manual_adjustment: "Ajuste manual",
  opening_balance: "Saldo inicial",
};

export const pricedTransactionTypes = new Set<PortfolioTransactionType>([
  "buy",
  "sell",
  "opening_balance",
]);

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  current: "Atualizada",
  stale: "Atrasada",
  manual: "Manual",
  estimated: "Estimada",
  incomplete: "Sem cotação",
};

export const dividendStatusLabels: Record<PortfolioDividendReceipt["status"], string> = {
  pending: "Pendente",
  received: "Recebido",
  cancelled: "Cancelado",
};
