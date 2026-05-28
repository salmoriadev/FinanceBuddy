import { NotFoundException } from "@nestjs/common";
import { normalizeTicker } from "../src/modules/assets/asset-normalization";
import { AssetsRepository } from "../src/modules/assets/assets.repository";
import { AssetsService } from "../src/modules/assets/assets.service";
import { InvestmentMarketDataService } from "../src/modules/investments/investment-market-data.service";

describe("asset normalization", () => {
  it("normalizes tickers before persistence and lookup", () => {
    expect(normalizeTicker(" petr 4 ")).toBe("PETR4");
    expect(normalizeTicker("btc-usd")).toBe("BTC-USD");
  });
});

describe("AssetsService", () => {
  const repository = {
    findAllByUser: jest.fn(),
    findByTicker: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    upsertProvider: jest.fn(),
    upsertManualProvider: jest.fn(),
    createQuote: jest.fn(),
    findLatestQuote: jest.fn(),
  } as unknown as jest.Mocked<AssetsRepository>;

  const marketData = {
    searchAssets: jest.fn(),
    getQuote: jest.fn(),
    getQuoteAt: jest.fn(),
  } as unknown as jest.Mocked<InvestmentMarketDataService>;

  const service = new AssetsService(repository, marketData);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates assets with normalized ticker and default metadata", async () => {
    repository.findByTicker.mockResolvedValue(null as never);
    repository.create.mockResolvedValue({ id: "asset-1" } as never);

    await service.create("user-1", {
      ticker: " petr 4 ",
      name: "Petrobras",
      class: "stock",
      currency: undefined,
    });

    expect(repository.create).toHaveBeenCalledWith("user-1", {
      ticker: "PETR4",
      name: "Petrobras",
      class: "stock",
      sector: null,
      currency: "BRL",
      notes: null,
    });
  });

  it("returns an existing user-scoped ticker instead of failing duplicate creation", async () => {
    repository.findByTicker.mockResolvedValue({ id: "asset-1" } as never);

    await expect(
      service.create("user-1", {
        ticker: "PETR4",
        name: "Petrobras",
        class: "stock",
      }),
    ).resolves.toEqual({ id: "asset-1" });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("requires assets to belong to the current user before manual quotes", async () => {
    repository.findById.mockResolvedValue(null as never);

    await expect(
      service.addManualQuote("user-1", "missing", { price: "10" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("stores looked up quotes for the requested date", async () => {
    repository.findById.mockResolvedValue({
      id: "asset-1",
      ticker: "PETR4",
      class: "stock",
      currency: "BRL",
    } as never);
    marketData.getQuoteAt.mockResolvedValue({
      symbol: "PETR4",
      name: "Petrobras",
      price: 38.42,
      currency: "BRL",
      provider: "brapi",
      updatedAt: new Date("2026-05-26T00:00:00.000Z"),
    } as never);
    repository.upsertProvider.mockResolvedValue({ id: "provider-1" } as never);
    repository.createQuote.mockResolvedValue({ id: "quote-1" } as never);

    const result = await service.lookupQuote("user-1", "asset-1", {
      date: "2026-05-26",
    });

    expect(marketData.getQuoteAt).toHaveBeenCalledWith(
      "PETR4",
      "stock",
      new Date("2026-05-26"),
    );
    expect(repository.createQuote).toHaveBeenCalledWith(
      "user-1",
      "asset-1",
      expect.objectContaining({
        currency: "BRL",
        source: "brapi",
        sourceType: "external",
        status: "current",
        quotedAt: new Date("2026-05-26T00:00:00.000Z"),
      }),
    );
    expect(result).toEqual({
      assetId: "asset-1",
      status: "current",
      cacheHit: false,
      quote: { id: "quote-1" },
      fallback: null,
    });
  });

  it("returns incomplete quote lookup instead of blocking when provider fails", async () => {
    repository.findById.mockResolvedValue({
      id: "asset-1",
      ticker: "HGLG11",
      class: "fii",
      currency: "BRL",
    } as never);
    marketData.getQuoteAt.mockRejectedValue(new Error("provider unavailable"));
    repository.findLatestQuote.mockResolvedValue(null as never);

    await expect(
      service.lookupQuote("user-1", "asset-1", { date: "2026-05-26" }),
    ).resolves.toEqual({
      assetId: "asset-1",
      status: "incomplete",
      cacheHit: false,
      quote: null,
      fallback: null,
      error: "provider unavailable",
    });
  });

  it("falls back to the latest quote when historical quote is unavailable", async () => {
    repository.findById.mockResolvedValue({
      id: "asset-1",
      ticker: "PETR4",
      class: "stock",
      currency: "BRL",
      quotes: [],
    } as never);
    marketData.getQuoteAt.mockResolvedValue(null as never);
    marketData.getQuote.mockResolvedValue({
      symbol: "PETR4",
      name: "Petrobras",
      price: 43.44,
      currency: "BRL",
      provider: "brapi",
      updatedAt: new Date("2026-05-27T12:00:00.000Z"),
    } as never);
    repository.upsertProvider.mockResolvedValue({ id: "provider-1" } as never);
    repository.createQuote.mockResolvedValue({ id: "quote-1" } as never);

    await expect(
      service.lookupQuote("user-1", "asset-1", { date: "2025-09-17" }),
    ).resolves.toEqual({
      assetId: "asset-1",
      status: "stale",
      cacheHit: false,
      quote: { id: "quote-1" },
      fallback: "latest",
    });
  });
});
