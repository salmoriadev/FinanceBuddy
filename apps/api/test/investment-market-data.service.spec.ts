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
      },
      {
        symbol: "HGLG11",
        name: "CSHG Logistica FII",
        type: "fii",
        exchange: "B3",
        currency: "BRL",
        provider: "brapi",
        logoUrl: null,
      },
      {
        symbol: "IVVB11",
        name: "iShares S&P 500 ETF",
        type: "etf",
        exchange: "B3",
        currency: "BRL",
        provider: "brapi",
        logoUrl: null,
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
});
