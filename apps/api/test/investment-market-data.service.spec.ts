import { ConfigService } from "@nestjs/config";
import { InvestmentMarketDataService } from "../src/modules/investments/investment-market-data.service";

const config = {
  get: jest.fn((key: string) => {
    if (key === "BRAPI_TOKEN") return "token-1";
    if (key === "NODE_ENV") return "production";
    return undefined;
  }),
} as unknown as jest.Mocked<ConfigService>;

describe("InvestmentMarketDataService", () => {
  let service: InvestmentMarketDataService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InvestmentMarketDataService(config);
    fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response) as unknown as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("maps Brapi asset search results to internal classes", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stocks: [
          { stock: "PETR4", name: "Petrobras PN", type: "stock" },
          { stock: "HGLG11", name: "CSHG Logistica FII", type: "fund" },
          { stock: "IVVB11", name: "iShares S&P 500 ETF", type: "fund" },
        ],
      }),
    } as Response);

    const result = await service.searchAssets("pet");

    expect(result).toEqual([
      {
        symbol: "PETR4",
        name: "Petrobras PN",
        type: "stock",
        exchange: "B3",
        currency: "BRL",
        provider: "brapi",
        logoUrl: null,
        price: null,
        quotedAt: expect.any(Date),
      },
      {
        symbol: "HGLG11",
        name: "CSHG Logistica FII",
        type: "fii",
        exchange: "B3",
        currency: "BRL",
        provider: "brapi",
        logoUrl: null,
        price: null,
        quotedAt: expect.any(Date),
      },
      {
        symbol: "IVVB11",
        name: "iShares S&P 500 ETF",
        type: "etf",
        exchange: "B3",
        currency: "BRL",
        provider: "brapi",
        logoUrl: null,
        price: null,
        quotedAt: expect.any(Date),
      },
    ]);
  });

  it("returns FII results when class filter is fii", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stocks: [{ stock: "HGLG11", name: "CSHG Logistica FII", type: "fund" }],
      }),
    } as Response);

    await expect(service.searchAssets("HGLG11", "fii")).resolves.toEqual([
      expect.objectContaining({
        symbol: "HGLG11",
        type: "fii",
      }),
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain("type=fund");
  });

  it("returns ETF results when class filter is etf", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stocks: [{ stock: "IVVB11", name: "iShares S&P 500 ETF", type: "fund" }],
      }),
    } as Response);

    await expect(service.searchAssets("IVVB11", "etf")).resolves.toEqual([
      expect.objectContaining({
        symbol: "IVVB11",
        type: "etf",
        provider: "brapi",
      }),
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain("type=fund");
  });

  it("trusts an explicit ETF filter when Brapi omits fund subtype metadata", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        requestedAt: "2026-08-22T12:00:00.000Z",
        stocks: [
          {
            stock: "AUPO11",
            name: "AUPO11",
            type: "fund",
            subType: null,
            close: 109.25,
          },
        ],
      }),
    } as Response);

    await expect(service.searchAssets("AUPO11", "etf")).resolves.toEqual([
      expect.objectContaining({
        symbol: "AUPO11",
        type: "etf",
        price: 109.25,
        quotedAt: new Date("2026-08-22T12:00:00.000Z"),
      }),
    ]);
  });

  it("retries common letter-one ticker confusion", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stocks: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stocks: [{ stock: "AUPO11", name: "AUPO11", type: "fund" }],
        }),
      } as Response);

    await expect(service.searchAssets("aupol1", "etf")).resolves.toEqual([
      expect.objectContaining({ symbol: "AUPO11", type: "etf" }),
    ]);
    expect(fetchMock.mock.calls[1][0]).toContain("search=AUPO11");
  });

  it("searches cryptocurrencies through the keyless CoinGecko API", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          coins: [
            {
              id: "bitcoin",
              name: "Bitcoin",
              symbol: "btc",
              market_cap_rank: 1,
              thumb: "https://coin-images.example/bitcoin.png",
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bitcoin: { brl: 396_017, last_updated_at: 1_787_412_930 },
        }),
      } as Response);

    await expect(service.searchAssets("bitcoin", "crypto")).resolves.toEqual([
      {
        symbol: "BTC",
        name: "Bitcoin",
        type: "crypto",
        exchange: "crypto",
        currency: "BRL",
        provider: "coingecko",
        logoUrl: "https://coin-images.example/bitcoin.png",
        price: 396_017,
        quotedAt: new Date(1_787_412_930_000),
      },
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain(
      "https://api.coingecko.com/api/v3/search?query=bitcoin",
    );
    expect(fetchMock.mock.calls[1][0]).toContain(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin",
    );
  });

  it("keeps cryptocurrency search results when price enrichment is unavailable", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          coins: [{ id: "bitcoin", name: "Bitcoin", symbol: "btc" }],
        }),
      } as Response)
      .mockResolvedValueOnce({ ok: false, status: 429 } as Response);

    await expect(service.searchAssets("bitcoin", "crypto")).resolves.toEqual([
      expect.objectContaining({
        symbol: "BTC",
        price: null,
        quotedAt: null,
      }),
    ]);
  });

  it.each(["fixed_income", "custom"])(
    "keeps %s assets on manual quotes",
    async (assetClass) => {
      await expect(service.searchAssets("treasury", assetClass)).resolves.toEqual([]);
      await expect(service.getQuote("TREASURY", assetClass)).resolves.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("maps Brapi quotes to internal quote payloads", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            symbol: "PETR4",
            longName: "Petrobras",
            currency: "BRL",
            regularMarketPrice: 38.25,
            regularMarketChangePercent: 1.2,
            regularMarketTime: "2026-05-26T12:00:00.000Z",
            exchangeName: "B3",
          },
        ],
      }),
    } as Response);

    const quote = await service.getQuote("petr4", "stock");

    expect(quote).toEqual({
      symbol: "PETR4",
      name: "Petrobras",
      price: 38.25,
      currency: "BRL",
      provider: "brapi",
      exchange: "B3",
      updatedAt: new Date("2026-05-26T12:00:00.000Z"),
      changePercent: 1.2,
      fallback: null,
    });
  });

  it("uses the public quote-list closing price when detailed quotes require a token", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requestedAt: "2026-08-22T12:00:00.000Z",
          stocks: [
            {
              stock: "HGLG11",
              name: "HGLG11",
              type: "fund",
              subType: "fii",
              close: 147.21,
            },
          ],
        }),
      } as Response);

    await expect(service.getQuote("HGLG11", "fii")).resolves.toEqual({
      symbol: "HGLG11",
      name: "HGLG11",
      price: 147.21,
      currency: "BRL",
      provider: "brapi",
      exchange: "B3",
      updatedAt: new Date("2026-08-22T12:00:00.000Z"),
      changePercent: null,
      fallback: "latest",
    });
  });

  it("maps CoinGecko prices without requiring a Brapi token", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        btc: {
          brl: 396_017,
          brl_24h_change: -0.99,
          last_updated_at: 1_787_412_930,
        },
      }),
    } as Response);

    const quote = await service.getQuote("btc", "crypto");

    expect(fetchMock.mock.calls[0][0]).toContain(
      "https://api.coingecko.com/api/v3/simple/price?",
    );
    expect(quote).toEqual({
      symbol: "BTC",
      name: "BTC",
      price: 396_017,
      currency: "BRL",
      provider: "coingecko",
      exchange: "crypto",
      updatedAt: new Date(1_787_412_930_000),
      changePercent: -0.99,
    });
  });

  it("maps Brapi historical quotes to the closest previous trading day", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            symbol: "PETR4",
            longName: "Petrobras",
            currency: "BRL",
            exchangeName: "B3",
            historicalDataPrice: [
              { date: "2026-05-19T00:00:00.000Z", close: 38.1 },
              { date: "2026-05-20T00:00:00.000Z", adjustedClose: 38.42 },
            ],
          },
        ],
      }),
    } as Response);

    const quote = await service.getQuoteAt(
      "petr4",
      "stock",
      new Date("2026-05-20T12:00:00.000Z"),
    );

    expect(fetchMock.mock.calls[0][0]).toContain("/api/quote/PETR4?");
    expect(fetchMock.mock.calls[0][0]).toContain("interval=1d");
    expect(quote).toEqual({
      symbol: "PETR4",
      name: "Petrobras",
      price: 38.42,
      currency: "BRL",
      provider: "brapi",
      exchange: "B3",
      updatedAt: new Date("2026-05-20T00:00:00.000Z"),
      changePercent: null,
    });
  });

  it("uses the closest CoinGecko price for historical crypto transactions", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          coins: [{ id: "bitcoin", name: "Bitcoin", symbol: "btc" }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prices: [
            [Date.parse("2026-05-20T10:00:00.000Z"), 350_000],
            [Date.parse("2026-05-20T20:00:00.000Z"), 352_500],
          ],
        }),
      } as Response);

    const quote = await service.getQuoteAt(
      "btc",
      "crypto",
      new Date("2026-05-20T12:00:00.000Z"),
    );

    expect(fetchMock.mock.calls[0][0]).toContain("/search?query=BTC");
    expect(fetchMock.mock.calls[1][0]).toContain(
      "/coins/bitcoin/market_chart/range?",
    );
    expect(quote).toEqual({
      symbol: "BTC",
      name: "Bitcoin",
      price: 352_500,
      currency: "BRL",
      provider: "coingecko",
      exchange: "crypto",
      updatedAt: new Date("2026-05-20T20:00:00.000Z"),
      changePercent: null,
    });
  });
});
