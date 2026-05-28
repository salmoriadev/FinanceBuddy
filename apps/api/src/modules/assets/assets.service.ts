import { Injectable } from "@nestjs/common";
import { DataSourceType, Prisma, Quote, QuoteStatus } from "@prisma/client";
import { assertResourceFound } from "../../common/services/resource-assertions";
import { InvestmentMarketDataService } from "../investments/investment-market-data.service";
import { normalizeTicker } from "./asset-normalization";
import { AssetsRepository } from "./assets.repository";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { CreateManualQuoteDto } from "./dto/create-manual-quote.dto";
import { LookupQuoteQueryDto } from "./dto/lookup-quote-query.dto";
import { SearchAssetsQueryDto } from "./dto/search-assets-query.dto";
import { ManualQuoteProvider } from "./quote-providers";

export const QUOTE_CACHE_TTL_MS = 15 * 60 * 1000;

const normalizeCurrency = (currency?: string | null) =>
  (currency?.trim().toUpperCase() || "BRL").slice(0, 8);

export const getEffectiveQuoteStatus = (
  quote: Pick<Quote, "sourceType" | "status" | "quotedAt"> | null | undefined,
  now = new Date(),
): QuoteStatus => {
  if (!quote) return "incomplete";
  if (quote.sourceType !== "external") return quote.status;
  return now.getTime() - quote.quotedAt.getTime() <= QUOTE_CACHE_TTL_MS
    ? "current"
    : "stale";
};

const isFreshExternalQuote = (quote: Quote | null | undefined) =>
  quote &&
  quote.sourceType === "external" &&
  getEffectiveQuoteStatus(quote) === "current";

@Injectable()
export class AssetsService {
  private readonly manualQuoteProvider = new ManualQuoteProvider();

  constructor(
    private readonly repository: AssetsRepository,
    private readonly marketData: InvestmentMarketDataService,
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
    const ticker = normalizeTicker(dto.ticker);
    const existing = await this.repository.findByTicker(userId, ticker);
    if (existing) {
      return existing;
    }

    try {
      return await this.repository.create(userId, {
        ticker,
        name: dto.name.trim(),
        class: dto.class,
        sector: dto.sector?.trim() || null,
        currency: normalizeCurrency(dto.currency),
        notes: dto.notes?.trim() || null,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const asset = await this.repository.findByTicker(userId, ticker);
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
      currency: normalizeCurrency(dto.currency ?? asset.currency),
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
    if (isFreshExternalQuote(latestQuote)) {
      return {
        assetId,
        status: "current" as QuoteStatus,
        cacheHit: true,
        quote: latestQuote,
      };
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
        currency: normalizeCurrency(quote.currency),
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
      const status: QuoteStatus =
        historicalQuote === null ? "stale" : sourceType === "mock" ? "estimated" : "current";
      const provider = await this.repository.upsertProvider(
        userId,
        quote.provider,
        sourceType,
        status,
      );
      const created = await this.repository.createQuote(userId, assetId, {
        providerId: provider.id,
        price: new Prisma.Decimal(quote.price),
        currency: normalizeCurrency(quote.currency),
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
        fallback: historicalQuote === null ? "latest" : null,
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
}
