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

export type InvestmentAssetClass =
  | "stock"
  | "fii"
  | "etf"
  | "bdr"
  | "fixed_income"
  | "crypto"
  | "custom";

export type MarketDataProvider = {
  searchAssets(
    query: string,
    assetClass?: string,
  ): Promise<InvestmentAssetSearchResult[]>;
  getQuote(
    symbol: string,
    assetClass?: InvestmentAssetClass | string | null,
  ): Promise<InvestmentQuote | null>;
  getQuoteAt(
    symbol: string,
    assetClass: InvestmentAssetClass | string | null | undefined,
    date: Date,
  ): Promise<InvestmentQuote | null>;
  getQuotes(symbols: string[]): Promise<Map<string, InvestmentQuote>>;
};

type BrapiListResult = {
  stock?: string;
  name?: string;
  sector?: string;
  type?: string;
  logo?: string;
};

type BrapiQuoteResult = {
  symbol?: string;
  shortName?: string;
  longName?: string;
  currency?: string;
  regularMarketPrice?: number | string;
  regularMarketChangePercent?: number | string;
  regularMarketTime?: string;
  exchangeName?: string;
};

type BrapiHistoricalPrice = {
  date?: number | string;
  close?: number | string;
  adjustedClose?: number | string;
};

type CoinGeckoSearchCoin = {
  id?: string;
  name?: string;
  symbol?: string;
  market_cap_rank?: number | null;
  thumb?: string;
};

type CoinGeckoSimplePrice = {
  brl?: number;
  brl_24h_change?: number | null;
  last_updated_at?: number;
};

type CoinGeckoMarketChart = {
  prices?: [number, number][];
};

const MOCK_ASSETS: InvestmentAssetSearchResult[] = [
  {
    symbol: "PETR4",
    name: "Petrobras PN",
    type: "stock",
    exchange: "B3",
    currency: "BRL",
    provider: "mock",
  },
  {
    symbol: "VALE3",
    name: "Vale ON",
    type: "stock",
    exchange: "B3",
    currency: "BRL",
    provider: "mock",
  },
  {
    symbol: "IVVB11",
    name: "iShares S&P 500 ETF",
    type: "etf",
    exchange: "B3",
    currency: "BRL",
    provider: "mock",
  },
  {
    symbol: "HGLG11",
    name: "CSHG Logistica FII",
    type: "fii",
    exchange: "B3",
    currency: "BRL",
    provider: "mock",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    type: "crypto",
    exchange: "manual",
    currency: "BRL",
    provider: "mock",
  },
];

const mockPriceFor = (symbol: string) => {
  const seed = symbol
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return Number(((seed % 250) + 10 + (seed % 19) / 100).toFixed(2));
};

const toFiniteNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeSymbol = (symbol: string) => symbol.trim().toUpperCase();
const isSameUtcDay = (left: Date, right: Date) =>
  left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);

const startOfUtcDay = (date: Date) =>
  new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);

const endOfUtcDay = (date: Date) =>
  new Date(`${date.toISOString().slice(0, 10)}T23:59:59.999Z`);

const toUnixSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

const parseHistoricalDate = (value: number | string | undefined) => {
  if (value === undefined) return null;
  if (typeof value === "number") {
    return new Date(value > 1_000_000_000_000 ? value : value * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isCryptoClass = (assetClass?: string | null) => assetClass === "crypto";
const isManualQuoteClass = (assetClass?: string | null) =>
  assetClass === "fixed_income" ||
  assetClass === "custom";
const CRYPTO_SYMBOLS = new Set(["BTC", "ETH", "SOL", "USDT", "BNB", "XRP", "ADA"]);
const isCryptoSymbol = (symbol: string) => CRYPTO_SYMBOLS.has(symbol);

const mapBrapiListTypeToAssetClass = (
  type: string | undefined,
  symbol: string,
  name: string,
): InvestmentAssetClass => {
  if (type === "bdr") return "bdr";
  if (type === "stock") return "stock";
  if (type === "fund") {
    const text = `${symbol} ${name}`.toUpperCase();
    if (
      text.includes("ETF") ||
      text.includes("ISHARES") ||
      ["BOVA", "IVVB", "SMAL", "HASH", "GOLD", "SPXI"].some((prefix) =>
        symbol.startsWith(prefix),
      )
    ) {
      return "etf";
    }
    return "fii";
  }
  return "custom";
};

const mapAssetClassToBrapiListType = (assetClass?: string) => {
  if (assetClass === "stock") return "stock";
  if (assetClass === "bdr") return "bdr";
  if (assetClass === "fii" || assetClass === "etf") return "fund";
  return undefined;
};

@Injectable()
export class InvestmentMarketDataService implements MarketDataProvider {
  private readonly logger = new Logger(InvestmentMarketDataService.name);
  private readonly baseUrl = "https://brapi.dev";
  private readonly coinGeckoBaseUrl = "https://api.coingecko.com/api/v3";

  constructor(private readonly configService: ConfigService) {}

  async searchAssets(query: string, type?: string) {
    const search = query.trim();
    if (search.length < 2) return [];
    if (isManualQuoteClass(type)) return [];

    try {
      if (isCryptoClass(type)) {
        return this.searchCryptoAssets(search);
      }

      const params = new URLSearchParams({
        search,
        limit: "12",
      });
      const brapiType = mapAssetClassToBrapiListType(type);
      if (brapiType) params.set("type", brapiType);
      this.addTokenParam(params);

      const payload = await this.fetchJson<{ stocks?: BrapiListResult[] }>(
        `/api/quote/list?${params.toString()}`,
      );

      return (payload.stocks ?? [])
        .map((item): InvestmentAssetSearchResult | null => {
          if (!item.stock) return null;
          const symbol = normalizeSymbol(item.stock);
          const name = item.name || symbol;
          const assetClass = mapBrapiListTypeToAssetClass(
            item.type,
            symbol,
            name,
          );
          if (type && type !== assetClass && type !== item.type) return null;
          return {
            symbol,
            name,
            type: assetClass,
            exchange: "B3",
            currency: "BRL",
            provider: "brapi",
            logoUrl: item.logo ?? null,
          };
        })
        .filter((item): item is InvestmentAssetSearchResult => Boolean(item));
    } catch (error) {
      if (!this.shouldUseMockFallback()) throw error;
      this.logger.warn(`Using mock asset search fallback: ${String(error)}`);
      return this.searchMockAssets(search, type);
    }
  }

  async getQuote(
    symbol: string,
    assetClass?: InvestmentAssetClass | string | null,
  ) {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) return null;
    if (isManualQuoteClass(assetClass)) return null;

    try {
      if (isCryptoClass(assetClass) || (!assetClass && isCryptoSymbol(normalized))) {
        return this.getCryptoQuote(normalized);
      }
      return this.getB3Quote(normalized);
    } catch (error) {
      if (!this.shouldUseMockFallback()) throw error;
      this.logger.warn(`Using mock quote fallback for ${normalized}: ${String(error)}`);
      return this.getMockQuote(normalized);
    }
  }

  async getQuoteAt(
    symbol: string,
    assetClass: InvestmentAssetClass | string | null | undefined,
    date: Date,
  ) {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) return null;
    if (isManualQuoteClass(assetClass)) return null;

    const targetDate = endOfUtcDay(date);
    if (isSameUtcDay(targetDate, new Date()) || targetDate > new Date()) {
      return this.getQuote(normalized, assetClass);
    }

    try {
      if (isCryptoClass(assetClass) || (!assetClass && isCryptoSymbol(normalized))) {
        return this.getCryptoHistoricalQuote(normalized, targetDate);
      }
      return this.getB3HistoricalQuote(normalized, targetDate);
    } catch (error) {
      if (!this.shouldUseMockFallback()) throw error;
      this.logger.warn(
        `Using mock historical quote fallback for ${normalized}: ${String(error)}`,
      );
      return {
        ...this.getMockQuote(normalized),
        updatedAt: targetDate,
      };
    }
  }

  async getQuotes(symbols: string[]) {
    const normalized = Array.from(
      new Set(symbols.map(normalizeSymbol).filter((symbol) => symbol.length > 0)),
    );
    if (normalized.length === 0) return new Map<string, InvestmentQuote>();

    const quotes = new Map<string, InvestmentQuote>();
    for (const symbol of normalized) {
      const quote = await this.getQuote(symbol);
      if (quote) quotes.set(symbol, quote);
    }

    return quotes;
  }

  private searchMockAssets(query: string, type?: string) {
    const normalized = query.toUpperCase();
    return MOCK_ASSETS.filter((asset) => {
      const matchesSearch =
        asset.symbol.includes(normalized) ||
        asset.name.toUpperCase().includes(normalized);
      const matchesType = !type || asset.type === type;
      return matchesSearch && matchesType;
    }).slice(0, 12);
  }

  private async searchCryptoAssets(query: string) {
    const params = new URLSearchParams({ query });
    const payload = await this.fetchCoinGeckoJson<{ coins?: CoinGeckoSearchCoin[] }>(
      `/search?${params.toString()}`,
    );

    return (payload.coins ?? [])
      .filter((coin) => Boolean(coin.symbol && coin.name))
      .slice(0, 12)
      .map((coin) => ({
        symbol: normalizeSymbol(coin.symbol ?? ""),
        name: coin.name ?? normalizeSymbol(coin.symbol ?? ""),
        type: "crypto",
        exchange: "crypto",
        currency: "BRL",
        provider: "coingecko",
        logoUrl: coin.thumb ?? null,
      }));
  }

  private async getB3Quote(symbol: string) {
    const params = new URLSearchParams();
    this.addTokenParam(params);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const payload = await this.fetchJson<{ results?: BrapiQuoteResult[] }>(
      `/api/quote/${encodeURIComponent(symbol)}${suffix}`,
    );
    const item = payload.results?.find(
      (result) => normalizeSymbol(result.symbol ?? "") === symbol,
    );
    const price = toFiniteNumber(item?.regularMarketPrice);
    if (!item || price === null) return null;

    return {
      symbol,
      name: item.longName || item.shortName || symbol,
      price,
      currency: item.currency || "BRL",
      provider: "brapi",
      exchange: item.exchangeName ?? "B3",
      updatedAt: item.regularMarketTime ? new Date(item.regularMarketTime) : new Date(),
      changePercent: toFiniteNumber(item.regularMarketChangePercent),
    };
  }

  private async getB3HistoricalQuote(symbol: string, targetDate: Date) {
    const startDate = startOfUtcDay(
      new Date(targetDate.getTime() - 7 * 24 * 60 * 60 * 1000),
    );
    const params = new URLSearchParams({
      interval: "1d",
      startDate: String(toUnixSeconds(startDate)),
      endDate: String(toUnixSeconds(targetDate)),
    });
    this.addTokenParam(params);
    const payload = await this.fetchJson<{ results?: BrapiQuoteResult[] }>(
      `/api/quote/${encodeURIComponent(symbol)}?${params.toString()}`,
    );
    const item = payload.results?.find(
      (result) => normalizeSymbol(result.symbol ?? "") === symbol,
    );
    const historical = (
      item as BrapiQuoteResult & { historicalDataPrice?: BrapiHistoricalPrice[] }
    )?.historicalDataPrice;
    const targetTime = targetDate.getTime();
    const closest = (historical ?? [])
      .map((price) => ({
        quotedAt: parseHistoricalDate(price.date),
        price: toFiniteNumber(price.adjustedClose ?? price.close),
      }))
      .filter(
        (price): price is { quotedAt: Date; price: number } =>
          Boolean(price.quotedAt) &&
          price.price !== null &&
          price.quotedAt.getTime() <= targetTime,
      )
      .sort((a, b) => b.quotedAt.getTime() - a.quotedAt.getTime())[0];

    if (!item || !closest) return null;

    return {
      symbol,
      name: item.longName || item.shortName || symbol,
      price: closest.price,
      currency: item.currency || "BRL",
      provider: "brapi",
      exchange: item.exchangeName ?? "B3",
      updatedAt: closest.quotedAt,
      changePercent: null,
    };
  }

  private async getCryptoQuote(symbol: string) {
    const params = new URLSearchParams({
      symbols: symbol.toLowerCase(),
      vs_currencies: "brl",
      include_24hr_change: "true",
      include_last_updated_at: "true",
    });
    const payload = await this.fetchCoinGeckoJson<Record<string, CoinGeckoSimplePrice>>(
      `/simple/price?${params.toString()}`,
    );
    const item = payload[symbol.toLowerCase()];
    const price = toFiniteNumber(item?.brl);
    if (!item || price === null) return null;

    return {
      symbol,
      name: symbol,
      price,
      currency: "BRL",
      provider: "coingecko",
      exchange: "crypto",
      updatedAt: item.last_updated_at
        ? new Date(item.last_updated_at * 1000)
        : new Date(),
      changePercent: toFiniteNumber(item.brl_24h_change),
    };
  }

  private async getCryptoHistoricalQuote(symbol: string, targetDate: Date) {
    const coin = await this.resolveCoinGeckoCoin(symbol);
    if (!coin?.id) return null;

    const startDate = startOfUtcDay(
      new Date(targetDate.getTime() - 7 * 24 * 60 * 60 * 1000),
    );
    const params = new URLSearchParams({
      vs_currency: "brl",
      from: String(toUnixSeconds(startDate)),
      to: String(toUnixSeconds(targetDate)),
      precision: "full",
    });
    const payload = await this.fetchCoinGeckoJson<CoinGeckoMarketChart>(
      `/coins/${encodeURIComponent(coin.id)}/market_chart/range?${params.toString()}`,
    );
    const targetTime = targetDate.getTime();
    const closest = (payload.prices ?? [])
      .map(([timestamp, price]) => ({
        quotedAt: new Date(timestamp),
        price: toFiniteNumber(price),
      }))
      .filter(
        (entry): entry is { quotedAt: Date; price: number } =>
          entry.price !== null &&
          !Number.isNaN(entry.quotedAt.getTime()) &&
          entry.quotedAt.getTime() <= targetTime,
      )
      .sort((left, right) => right.quotedAt.getTime() - left.quotedAt.getTime())[0];
    if (!closest) return null;

    return {
      symbol,
      name: coin.name || symbol,
      price: closest.price,
      currency: "BRL",
      provider: "coingecko",
      exchange: "crypto",
      updatedAt: closest.quotedAt,
      changePercent: null,
    };
  }

  private async resolveCoinGeckoCoin(symbol: string) {
    const params = new URLSearchParams({ query: symbol });
    const payload = await this.fetchCoinGeckoJson<{ coins?: CoinGeckoSearchCoin[] }>(
      `/search?${params.toString()}`,
    );
    return (payload.coins ?? []).find(
      (coin) => normalizeSymbol(coin.symbol ?? "") === symbol,
    );
  }

  private getMockQuote(symbol: string): InvestmentQuote {
    const asset = MOCK_ASSETS.find((item) => item.symbol === symbol);
    return {
      symbol,
      name: asset?.name ?? symbol,
      price: mockPriceFor(symbol),
      currency: asset?.currency ?? "BRL",
      provider: "mock",
      exchange: asset?.exchange ?? "manual",
      updatedAt: new Date(),
      changePercent: null,
    };
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      throw new Error(`Brapi returned ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  private async fetchCoinGeckoJson<T>(path: string): Promise<T> {
    const response = await fetch(`${this.coinGeckoBaseUrl}${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      throw new Error(`CoinGecko returned ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  private buildHeaders() {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    const token = this.configService.get<string>("BRAPI_TOKEN");
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  private addTokenParam(params: URLSearchParams) {
    const token = this.configService.get<string>("BRAPI_TOKEN");
    if (token) params.set("token", token);
  }

  private shouldUseMockFallback() {
    const explicit = this.configService.get<string>("MARKET_DATA_ENABLE_MOCK_FALLBACK");
    if (explicit !== undefined) return explicit !== "false";
    return this.configService.get<string>("NODE_ENV") !== "production";
  }
}
