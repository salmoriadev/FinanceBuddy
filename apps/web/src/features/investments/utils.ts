import type { Asset, AssetClass, PortfolioPosition } from "@/types/finance";
import { ASSET_CLASSES } from "./constants";
import type { AssetClassOption } from "./constants";
import type { PositionGroup } from "./types";

const padDatePart = (value: number) => String(value).padStart(2, "0");

export const today = (date = new Date()) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;

export const currentMonth = (date = new Date()) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}`;

export const parseDecimal = (value: string) => {
  const input = value.trim();
  if (!input) return 0;

  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)[eE][+-]?\d+$/.test(input)) {
    const canonical = Number(input);
    return Number.isFinite(canonical) ? canonical : 0;
  }

  const decimalSeparatorIndex = Math.max(
    input.lastIndexOf("."),
    input.lastIndexOf(","),
  );
  const normalized =
    decimalSeparatorIndex === -1
      ? input
      : `${input.slice(0, decimalSeparatorIndex).replace(/[.,]/g, "")}.${input.slice(decimalSeparatorIndex + 1)}`;

  if (!/^[+-]?\d+(?:\.\d+)?$/.test(normalized)) return 0;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  const message =
    error instanceof Error && error.message
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  const normalized = message.trim().toLowerCase();
  if (normalized === "internal server error") {
    return "Ocorreu um erro interno. Tente novamente.";
  }
  if (normalized === "not authenticated" || normalized === "unauthorized") {
    return "Sua sessão expirou. Entre novamente.";
  }
  if (normalized === "forbidden" || normalized === "forbidden resource") {
    return "Você não tem permissão para realizar esta ação.";
  }
  if (normalized === "asset not found") return "Ativo não encontrado.";
  if (normalized === "portfolio not found") return "Carteira não encontrada.";
  if (normalized === "dividend receipt is not pending") {
    return "Este provento já foi processado.";
  }
  if (normalized === "sell quantity exceeds the available position") {
    return "A quantidade da venda excede a posição disponível.";
  }
  if (normalized === "quantity is required for this transaction") {
    return "Informe a quantidade para este evento.";
  }
  if (normalized === "total amount or quantity/unitprice is required") {
    return "Informe o valor total ou a quantidade e o preço unitário.";
  }
  if (normalized === "quantity/amount per share or total amount is required") {
    return "Informe a quantidade e o valor por cota ou o valor total.";
  }
  if (normalized === "month must use yyyy-mm") {
    return "Selecione um mês válido.";
  }

  return fallback;
};

export const toAssetClass = (value: string | undefined): AssetClass => {
  if (value && ASSET_CLASSES.includes(value as AssetClass)) {
    return value as AssetClass;
  }
  return "custom";
};

export const currencyForAssetClass = (
  assetClass: AssetClassOption,
  currentCurrency = "BRL",
) => {
  if (assetClass === "fixed_income_brl") return "BRL";
  if (assetClass === "fixed_income_usd") return "USD";
  return currentCurrency;
};

export const toPersistedAssetClass = (
  assetClass: AssetClassOption,
): AssetClass =>
  assetClass === "fixed_income_brl" || assetClass === "fixed_income_usd"
    ? "fixed_income"
    : assetClass;

export const assetMatchesClassOption = (
  asset: Pick<Asset, "class" | "currency">,
  assetClass: AssetClassOption,
) => {
  if (assetClass === "fixed_income_brl") {
    return asset.class === "fixed_income" && asset.currency.toUpperCase() === "BRL";
  }
  if (assetClass === "fixed_income_usd") {
    return asset.class === "fixed_income" && asset.currency.toUpperCase() === "USD";
  }
  return asset.class === assetClass;
};

export const classOptionForAsset = (
  asset: Pick<Asset, "class" | "currency">,
): AssetClassOption => {
  if (asset.class !== "fixed_income") return asset.class;
  if (asset.currency.toUpperCase() === "USD") return "fixed_income_usd";
  if (asset.currency.toUpperCase() === "BRL") return "fixed_income_brl";
  return "fixed_income";
};

export const buildGroups = (positions: PortfolioPosition[]): PositionGroup[] => {
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
