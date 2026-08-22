import { Injectable } from "@nestjs/common";
import { DataSourceType, Prisma, Quote, QuoteStatus } from "@prisma/client";
import { assertResourceFound } from "../../common/services/resource-assertions";
import { InvestmentMarketDataService } from "../investments/investment-market-data.service";
import { normalizeTicker } from "./asset-normalization";
import { normalizeAssetCreateData, normalizeAssetCurrency } from "./asset-terms";
import { AssetsRepository } from "./assets.repository";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { CreateManualQuoteDto } from "./dto/create-manual-quote.dto";
import { LookupQuoteQueryDto } from "./dto/lookup-quote-query.dto";
import { SearchAssetsQueryDto } from "./dto/search-assets-query.dto";
import { ManualQuoteProvider } from "./quote-providers";
import { FixedIncomeValuationService } from "./fixed-income-valuation.service";

export const QUOTE_CACHE_TTL_MS = 15 * 60 * 1000;

export const getEffectiveQuoteStatus = (
  quote: Pick<Quote, "sourceType" | "status" | "quotedAt"> | null | undefined,
  now = new Date(),
): QuoteStatus => {
  if (!quote) return "incomplete";
  if (quote.status === "estimated") {
    return now.getTime() - quote.quotedAt.getTime() <= QUOTE_CACHE_TTL_MS
      ? "estimated"
      : "stale";
  }
  if (quote.sourceType !== "external") return quote.status;
  return now.getTime() - quote.quotedAt.getTime() <= QUOTE_CACHE_TTL_MS
    ? "current"
    : "stale";
};

const isFreshReusableQuote = (quote: Quote | null | undefined) =>
  quote &&
  ["current", "estimated"].includes(getEffectiveQuoteStatus(quote));

@Injectable()
export class AssetsService {
  private readonly manualQuoteProvider = new ManualQuoteProvider();

  constructor(
    private readonly repository: AssetsRepository,
    private readonly marketData: InvestmentMarketDataService,
    private readonly fixedIncomeValuation: FixedIncomeValuationService,
  ) {}

  findAll(userId: string) {
    return this.repository.findAllByUser(userId);
  }

  searchAssets(query: SearchAssetsQueryDto) {
    return this.marketData.searchAssets(query.q, query.class);
  }

  async findByTicker(userId: string, ticker: string) {
    const asset = await this.repository.findByTicker(userId, normalizeTicker(ticker));
    return assertResourceFound(asset, "Asset not found");
  }

  async create(userId: string, dto: CreateAssetDto) {
    const data = normalizeAssetCreateData(dto);
    const existing = await this.repository.findByTicker(userId, data.ticker);
    if (existing) {
      return existing;
    }

    try {
      return await this.repository.create(userId, {
        ...data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const asset = await this.repository.findByTicker(userId, data.ticker);
        if (asset) return asset;
      }
      throw error;
    }
  }

  async addManualQuote(userId: string, assetId: string, dto: CreateManualQuoteDto) {
    const asset = await this.repository.findById(userId, assetId);
    assertResourceFound(asset, "Asset not found");

    const quote = this.manualQuoteProvider.quote({
      price: dto.price,
      currency: normalizeAssetCurrency(dto.currency ?? asset.currency),
      source: dto.source,
      quotedAt: dto.quotedAt,
    });
    const provider = await this.repository.upsertManualProvider(userId, quote.source);

    return this.repository.createQuote(userId, assetId, {
      ...quote,
      providerId: provider.id,
    });
  }

  async refreshQuote(userId: string, assetId: string) {
    const asset = await this.repository.findById(userId, assetId);
    assertResourceFound(asset, "Asset not found");

    const latestQuote = asset.quotes?.[0] ?? await this.repository.findLatestQuote(userId, assetId);
    if (isFreshReusableQuote(latestQuote)) {
      return {
        assetId,
        status: getEffectiveQuoteStatus(latestQuote),
        cacheHit: true,
        quote: latestQuote,
      };
    }

    if (asset.class === "fixed_income") {
      try {
        const quote = await this.createFixedIncomeQuote(userId, asset, new Date());
        return {
          assetId,
          status: quote ? "estimated" as QuoteStatus : "incomplete" as QuoteStatus,
          cacheHit: false,
          quote,
        };
      } catch (error) {
        return {
          assetId,
          status: latestQuote ? "stale" as QuoteStatus : "incomplete" as QuoteStatus,
          cacheHit: false,
          quote: latestQuote ?? null,
          error:
            error instanceof Error
              ? error.message
              : "Fixed-income valuation failed",
        };
      }
    }

    try {
      const quote = await this.marketData.getQuote(asset.ticker, asset.class);
      if (!quote) {
        return {
          assetId,
          status: latestQuote ? "stale" : "incomplete",
          cacheHit: false,
          quote: latestQuote ?? null,
        };
      }

      const sourceType: DataSourceType =
        quote.provider === "mock" ? "mock" : "external";
      const status: QuoteStatus = sourceType === "mock" ? "estimated" : "current";
      const provider = await this.repository.upsertProvider(
        userId,
        quote.provider,
        sourceType,
        status,
      );
      const created = await this.repository.createQuote(userId, assetId, {
        providerId: provider.id,
        price: new Prisma.Decimal(quote.price),
        currency: normalizeAssetCurrency(quote.currency),
        source: quote.provider,
        sourceType,
        status,
        quotedAt: quote.updatedAt,
      });

      return {
        assetId,
        status,
        cacheHit: false,
        quote: created,
      };
    } catch (error) {
      return {
        assetId,
        status: latestQuote ? "stale" : "incomplete",
        cacheHit: false,
        quote: latestQuote ?? null,
        error: error instanceof Error ? error.message : "Quote refresh failed",
      };
    }
  }

  async lookupQuote(userId: string, assetId: string, query: LookupQuoteQueryDto) {
    const asset = await this.repository.findById(userId, assetId);
    assertResourceFound(asset, "Asset not found");

    const quoteDate = query.date ? new Date(query.date) : new Date();
    if (asset.class === "fixed_income") {
      try {
        const quote = await this.createFixedIncomeQuote(userId, asset, quoteDate);
        return {
          assetId,
          status: quote ? "estimated" as QuoteStatus : "incomplete" as QuoteStatus,
          cacheHit: false,
          quote,
          fallback: null,
        };
      } catch (error) {
        const latestQuote =
          asset.quotes?.[0] ?? (await this.repository.findLatestQuote(userId, assetId));
        return {
          assetId,
          status: latestQuote ? "stale" as QuoteStatus : "incomplete" as QuoteStatus,
          cacheHit: false,
          quote: latestQuote ?? null,
          fallback: latestQuote ? "cached" as const : null,
          error:
            error instanceof Error
              ? error.message
              : "Fixed-income valuation failed",
        };
      }
    }
    try {
      const historicalQuote = await this.marketData.getQuoteAt(
        asset.ticker,
        asset.class,
        quoteDate,
      );
      const quote =
        historicalQuote ?? (await this.marketData.getQuote(asset.ticker, asset.class));

      if (!quote) {
        const latestQuote =
          asset.quotes?.[0] ?? (await this.repository.findLatestQuote(userId, assetId));
        return {
          assetId,
          status: latestQuote ? "stale" as QuoteStatus : "incomplete" as QuoteStatus,
          cacheHit: Boolean(latestQuote),
          quote: latestQuote ?? null,
          fallback: latestQuote ? "cached" : null,
        };
      }

      const sourceType: DataSourceType =
        quote.provider === "mock" ? "mock" : "external";
      const usedLatestFallback =
        historicalQuote === null || quote.fallback === "latest";
      const status: QuoteStatus =
        usedLatestFallback ? "stale" : sourceType === "mock" ? "estimated" : "current";
      const provider = await this.repository.upsertProvider(
        userId,
        quote.provider,
        sourceType,
        status,
      );
      const created = await this.repository.createQuote(userId, assetId, {
        providerId: provider.id,
        price: new Prisma.Decimal(quote.price),
        currency: normalizeAssetCurrency(quote.currency),
        source: quote.provider,
        sourceType,
        status,
        quotedAt: quote.updatedAt,
      });

      return {
        assetId,
        status,
        cacheHit: false,
        quote: created,
        fallback: usedLatestFallback ? "latest" : null,
      };
    } catch (error) {
      const latestQuote =
        asset.quotes?.[0] ?? (await this.repository.findLatestQuote(userId, assetId));
      return {
        assetId,
        status: latestQuote ? "stale" as QuoteStatus : "incomplete" as QuoteStatus,
        cacheHit: false,
        quote: latestQuote ?? null,
        fallback: latestQuote ? "cached" : null,
        error: error instanceof Error ? error.message : "Quote lookup failed",
      };
    }
  }

  private async createFixedIncomeQuote(
    userId: string,
    asset: {
      id: string;
      currency: string;
      fixedIncomeIndexer: "fixed" | "cdi" | "ipca" | null;
      fixedIncomeRate: Prisma.Decimal | null;
      fixedIncomeBaseDate: Date | null;
    },
    valuationDate: Date,
  ) {
    if (
      !asset.fixedIncomeIndexer ||
      asset.fixedIncomeRate === null ||
      !asset.fixedIncomeBaseDate ||
      valuationDate < asset.fixedIncomeBaseDate
    ) {
      return null;
    }

    const factor = await this.fixedIncomeValuation.factorAt(
      {
        indexer: asset.fixedIncomeIndexer,
        rate: asset.fixedIncomeRate,
        baseDate: asset.fixedIncomeBaseDate,
      },
      valuationDate,
    );
    const source = this.fixedIncomeValuation.providerFor(asset.fixedIncomeIndexer);
    const sourceType: DataSourceType =
      asset.fixedIncomeIndexer === "fixed" ? "manual" : "external";
    const provider = await this.repository.upsertProvider(
      userId,
      source,
      sourceType,
      "estimated",
    );

    return this.repository.createQuote(userId, asset.id, {
      providerId: provider.id,
      price: factor,
      currency: asset.currency,
      source,
      sourceType,
      status: "estimated",
      quotedAt: valuationDate,
    });
  }
}
