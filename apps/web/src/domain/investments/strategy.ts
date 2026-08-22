import { Investment } from "@/types/finance";

export type InvestmentType = "fixed" | "variable" | "crypto" | "custom";

export interface InvestmentReturnInput {
  investedAmount: number;
  currentValue: number;
  startDate?: string | null;
}

export interface InvestmentReturnSummary {
  invested: number;
  current: number;
  profit: number;
  roi: number;
  type: InvestmentType;
  label: string;
}

export interface InvestmentReturnStrategy {
  type: InvestmentType;
  label: string;
  calculate: (input: InvestmentReturnInput) => InvestmentReturnSummary;
}

const buildSummary = (
  type: InvestmentType,
  label: string,
  input: InvestmentReturnInput,
): InvestmentReturnSummary => {
  const invested = Number(input.investedAmount) || 0;
  const current = Number(input.currentValue) || 0;
  const profit = current - invested;
  const roi = invested > 0 ? (profit / invested) * 100 : 0;
  return { invested, current, profit, roi, type, label };
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const TYPE_KEYWORDS: Record<InvestmentType, string[]> = {
  fixed: [
    "renda fixa",
    "fixed income",
    "bond",
    "treasury",
    "cdb",
    "lci",
    "lca",
    "debenture",
    "ipca",
    "selic",
    "prefixado",
    "certificate",
    "cd",
    "bonds",
  ],
  variable: [
    "acao",
    "acoes",
    "fii",
    "stocks",
    "stock",
    "equity",
    "etf",
    "reit",
    "bdr",
    "bolsa",
    "shares",
  ],
  crypto: ["cripto", "crypto", "bitcoin", "btc", "ethereum", "eth", "altcoin"],
  custom: [],
};

class FixedIncomeStrategy implements InvestmentReturnStrategy {
  readonly type: InvestmentType = "fixed";
  readonly label = "Renda fixa";

  calculate(input: InvestmentReturnInput) {
    return buildSummary(this.type, this.label, input);
  }
}

class VariableIncomeStrategy implements InvestmentReturnStrategy {
  readonly type: InvestmentType = "variable";
  readonly label = "Renda variável";

  calculate(input: InvestmentReturnInput) {
    return buildSummary(this.type, this.label, input);
  }
}

class CryptoStrategy implements InvestmentReturnStrategy {
  readonly type: InvestmentType = "crypto";
  readonly label = "Criptomoedas";

  calculate(input: InvestmentReturnInput) {
    return buildSummary(this.type, this.label, input);
  }
}

class CustomStrategy implements InvestmentReturnStrategy {
  readonly type: InvestmentType = "custom";
  readonly label = "Outros";

  calculate(input: InvestmentReturnInput) {
    return buildSummary(this.type, this.label, input);
  }
}

const STRATEGIES: Record<InvestmentType, InvestmentReturnStrategy> = {
  fixed: new FixedIncomeStrategy(),
  variable: new VariableIncomeStrategy(),
  crypto: new CryptoStrategy(),
  custom: new CustomStrategy(),
};

export const inferInvestmentType = (
  name?: string | null,
  category?: string | null,
): InvestmentType => {
  const haystack = normalizeText(`${name ?? ""} ${category ?? ""}`.trim());
  if (!haystack) return "custom";

  const entries = Object.entries(TYPE_KEYWORDS) as [
    InvestmentType,
    string[],
  ][];
  for (const [type, keywords] of entries) {
    if (type === "custom") continue;
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return type;
    }
  }
  return "custom";
};

export const getInvestmentStrategy = (
  type: InvestmentType,
): InvestmentReturnStrategy => STRATEGIES[type] ?? STRATEGIES.custom;

export const calculateInvestmentSummary = (
  investment: Investment,
): InvestmentReturnSummary => {
  const type = inferInvestmentType(investment.name, investment.category);
  const strategy = getInvestmentStrategy(type);
  return strategy.calculate({
    investedAmount: Number(investment.invested_amount),
    currentValue: Number(investment.current_value),
    startDate: investment.start_date,
  });
};

export const calculatePortfolioSummary = (
  investments: Investment[],
): InvestmentReturnSummary => {
  const invested = investments.reduce(
    (sum, item) => sum + Number(item.invested_amount),
    0,
  );
  const current = investments.reduce(
    (sum, item) => sum + Number(item.current_value),
    0,
  );
  return buildSummary("custom", "Carteira", {
    investedAmount: invested,
    currentValue: current,
  });
};
