import type {
  AssetClass,
  PortfolioPosition,
  PortfolioTransactionType,
} from "@/types/finance";

export type PositionGroup = {
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

export type AssetFormState = {
  ticker: string;
  name: string;
  class: AssetClass;
  sector: string;
  currency: string;
  notes: string;
};

export type TransactionFormState = {
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

export type DividendFormState = {
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
