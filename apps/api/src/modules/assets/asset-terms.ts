import { BadRequestException } from "@nestjs/common";
import { AssetClass, FixedIncomeIndexer, Prisma } from "@prisma/client";
import { normalizeTicker } from "./asset-normalization";
import { CreateAssetDto } from "./dto/create-asset.dto";

export type NormalizedAssetCreateData = {
  ticker: string;
  name: string;
  class: AssetClass;
  sector: string | null;
  currency: string;
  notes: string | null;
  fixedIncomeIndexer: FixedIncomeIndexer | null;
  fixedIncomeRate: Prisma.Decimal | null;
};

export const normalizeAssetCurrency = (currency?: string | null) =>
  (currency?.trim().toUpperCase() || "BRL").slice(0, 8);

export const normalizeAssetCreateData = (
  dto: CreateAssetDto,
): NormalizedAssetCreateData => {
  const currency = normalizeAssetCurrency(dto.currency);
  const fixedIncomeIndexer = dto.fixedIncomeIndexer ?? null;
  const fixedIncomeRate =
    dto.fixedIncomeRate === undefined || dto.fixedIncomeRate === null
      ? null
      : new Prisma.Decimal(dto.fixedIncomeRate);

  if (dto.class !== "fixed_income" && (fixedIncomeIndexer || fixedIncomeRate)) {
    throw new BadRequestException(
      "Fixed-income terms can only be used with a fixed-income asset",
    );
  }

  if (dto.class === "fixed_income") {
    if (!fixedIncomeIndexer || fixedIncomeRate === null) {
      throw new BadRequestException(
        "Fixed-income indexer and rate are required",
      );
    }
    if (fixedIncomeIndexer === "fixed" && fixedIncomeRate.lte(0)) {
      throw new BadRequestException("The annual fixed rate must be greater than zero");
    }
    if (fixedIncomeIndexer === "cdi" && fixedIncomeRate.lte(0)) {
      throw new BadRequestException("The CDI percentage must be greater than zero");
    }
    if (fixedIncomeIndexer === "cdi" && fixedIncomeRate.gt(500)) {
      throw new BadRequestException("The CDI percentage cannot exceed 500%");
    }
    if (fixedIncomeIndexer !== "cdi" && fixedIncomeRate.gt(100)) {
      throw new BadRequestException("The annual rate cannot exceed 100%");
    }
    if (currency === "USD" && fixedIncomeIndexer !== "fixed") {
      throw new BadRequestException(
        "Dollar fixed income currently supports fixed rates only",
      );
    }
  }

  return {
    ticker: normalizeTicker(dto.ticker),
    name: dto.name.trim(),
    class: dto.class,
    sector: dto.sector?.trim() || null,
    currency,
    notes: dto.notes?.trim() || null,
    fixedIncomeIndexer,
    fixedIncomeRate,
  };
};
