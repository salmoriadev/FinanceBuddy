import type { AssetClass, PortfolioPosition } from "@/types/finance";
import { ASSET_CLASSES } from "./constants";
import type { PositionGroup } from "./types";

export const today = () => new Date().toISOString().slice(0, 10);
export const currentMonth = () => new Date().toISOString().slice(0, 7);

export const parseDecimal = (value: string) => {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return fallback;
};

export const toAssetClass = (value: string | undefined): AssetClass => {
  if (value && ASSET_CLASSES.includes(value as AssetClass)) {
    return value as AssetClass;
  }
  return "custom";
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
