import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type InvestmentAssetSearchResult = {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  currency: string;
  provider: string;
  logoUrl?: string | null;
};

export type InvestmentQuote = {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  provider: string;
  exchange?: string | null;
  updatedAt: Date;
  changePercent?: number | null;
};

type BrapiQuoteResult = {
  symbol?: string;
  shortName?: string;
  longName?: string;
  currency?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: string;
  exchangeName?: string;
};

type BrapiListResult = {
  stock?: string;
  name?: string;
  type?: string;
  logo?: string;
};

const toFiniteNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

@Injectable()
export class InvestmentMarketDataService {
  private readonly logger = new Logger(InvestmentMarketDataService.name);

  constructor(private readonly configService: ConfigService) {}

  async searchAssets(query: string, type?: string) {
    const search = query.trim();
    if (search.length < 2) return [];

    const params = new URLSearchParams({
      search,
      limit: "12",
    });
    if (type) params.set("type", type);
    this.addToken(params);

    const payload = await this.getJson<{ stocks?: BrapiListResult[] }>(
      `https://brapi.dev/api/quote/list?${params.toString()}`,
    );

    return (payload.stocks ?? [])
      .map((item): InvestmentAssetSearchResult | null => {
        if (!item.stock) return null;
        return {
          symbol: item.stock.toUpperCase(),
          name: item.name || item.stock.toUpperCase(),
          type: item.type || "asset",
          exchange: "B3",
          currency: "BRL",
          provider: "brapi",
          logoUrl: item.logo ?? null,
        };
      })
      .filter((item): item is InvestmentAssetSearchResult => Boolean(item));
  }

  async getQuotes(symbols: string[]) {
    const normalized = Array.from(
      new Set(
        symbols
          .map((symbol) => symbol.trim().toUpperCase())
          .filter((symbol) => symbol.length > 0),
      ),
    );
    if (normalized.length === 0) return new Map<string, InvestmentQuote>();

    const params = new URLSearchParams();
    this.addToken(params);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const payload = await this.getJson<{ results?: BrapiQuoteResult[] }>(
      `https://brapi.dev/api/quote/${normalized.join(",")}${suffix}`,
    );

    const quotes = new Map<string, InvestmentQuote>();
    for (const item of payload.results ?? []) {
      if (!item.symbol) continue;
      const price = toFiniteNumber(item.regularMarketPrice);
      if (price === null) continue;
      quotes.set(item.symbol.toUpperCase(), {
        symbol: item.symbol.toUpperCase(),
        name: item.longName || item.shortName || item.symbol.toUpperCase(),
        price,
        currency: item.currency || "BRL",
        provider: "brapi",
        exchange: item.exchangeName ?? "B3",
        updatedAt: item.regularMarketTime
          ? new Date(item.regularMarketTime)
          : new Date(),
        changePercent: toFiniteNumber(item.regularMarketChangePercent),
      });
    }

    return quotes;
  }

  private addToken(params: URLSearchParams) {
    const token = this.configService.get<string>("BRAPI_TOKEN");
    if (token) params.set("token", token);
  }

  private async getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      const message = `Market data provider returned ${response.status}`;
      this.logger.warn(message);
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  }
}
