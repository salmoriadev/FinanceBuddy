import { Prisma } from "@prisma/client";
import { AssetsService } from "../src/modules/assets/assets.service";
import { calculatePosition } from "../src/modules/portfolios/portfolio-calculations";
import { PortfoliosRepository } from "../src/modules/portfolios/portfolios.repository";
import { PortfoliosService } from "../src/modules/portfolios/portfolios.service";

const dec = (value: string | number) => new Prisma.Decimal(value);

describe("PortfoliosService", () => {
  const repository = {
    findAllByUser: jest.fn(),
    findById: jest.fn(),
    findAsset: jest.fn(),
    create: jest.fn(),
    findPortfolioTransactions: jest.fn(),
    findPortfolioTransactionsBetween: jest.fn(),
    findPortfolioTransactionsUntil: jest.fn(),
    createTransaction: jest.fn(),
    createDividendEvent: jest.fn(),
    createDividendReceipt: jest.fn(),
    findDividendReceipt: jest.fn(),
    findDividendReceipts: jest.fn(),
    findDividendReceiptsBetween: jest.fn(),
    updateDividendReceiptAsReceived: jest.fn(),
    updateDividendEventStatus: jest.fn(),
    ensureDefault: jest.fn(),
    findLegacyInvestments: jest.fn(),
    findLegacyMigration: jest.fn(),
    upsertLegacyAsset: jest.fn(),
    createLegacyQuote: jest.fn(),
  } as unknown as jest.Mocked<PortfoliosRepository>;

  const assetsService = {
    refreshQuote: jest.fn(),
  } as unknown as jest.Mocked<AssetsService>;

  const service = new PortfoliosService(repository, assetsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps net sale proceeds consistent from the service through position calculations", async () => {
    repository.findById.mockResolvedValue({ id: "portfolio-1" } as never);
    repository.findAsset.mockResolvedValue({
      id: "asset-1",
      currency: "BRL",
    } as never);
    (repository.createTransaction as jest.Mock).mockImplementation(
      async (_userId, _portfolioId, data) => ({
        id: `tx-${data.type}`,
        ...data,
      }),
    );

    const buy = await service.addTransaction("user-1", "portfolio-1", {
      assetId: "asset-1",
      type: "buy",
      quantity: "10",
      unitPrice: "15",
      fees: "2",
      taxes: "3",
      occurredAt: "2026-01-01",
    });
    const sell = await service.addTransaction("user-1", "portfolio-1", {
      assetId: "asset-1",
      type: "sell",
      quantity: "5",
      unitPrice: "30",
      fees: "1",
      taxes: "2",
      occurredAt: "2026-01-02",
    });

    expect(buy).toEqual(
      expect.objectContaining({
        grossAmount: dec(150),
        totalAmount: dec(155),
      }),
    );
    expect(sell).toEqual(
      expect.objectContaining({
        grossAmount: dec(150),
        totalAmount: dec(147),
      }),
    );

    const position = calculatePosition([buy as never, sell as never]);

    expect(position.quantity.toString()).toBe("5");
    expect(position.costBasis.toString()).toBe("77.5");
    expect(position.realizedGain.toString()).toBe("69.5");
  });

  it("returns portfolios even when one legacy investment migration fails", async () => {
    const portfolio = { id: "portfolio-1", isDefault: true };
    repository.ensureDefault.mockResolvedValue(portfolio as never);
    repository.findLegacyInvestments.mockResolvedValue([
      {
        id: "legacy-1",
        name: "Legacy position",
        category: "Acoes",
        assetSymbol: "PETR4",
        quantity: dec(1),
        investedAmount: dec(40),
        currentValue: dec(45),
        marketPrice: dec(45),
        quoteCurrency: "BRL",
        startDate: new Date("2026-01-01"),
        createdAt: new Date("2026-01-01"),
        notes: null,
      },
    ] as never);
    repository.findLegacyMigration.mockResolvedValue(null as never);
    repository.upsertLegacyAsset.mockRejectedValue(new Error("legacy asset failed"));
    repository.findAllByUser.mockResolvedValue([portfolio] as never);

    await expect(service.findAll("user-1")).resolves.toEqual([portfolio]);
    expect(repository.findAllByUser).toHaveBeenCalledWith("user-1");
  });

  it("marks a dividend as received by appending a dividend transaction", async () => {
    repository.findById.mockResolvedValue({ id: "portfolio-1" } as never);
    repository.findDividendReceipt.mockResolvedValue({
      id: "receipt-1",
      assetId: "asset-1",
      dividendEventId: "event-1",
      status: "pending",
      quantity: dec(10),
      amountPerShare: dec("1.25"),
      grossAmount: null,
      taxes: dec(0),
      totalAmount: null,
      currency: "BRL",
      paymentDate: new Date("2026-05-20"),
      notes: null,
    } as never);
    repository.createTransaction.mockResolvedValue({ id: "tx-1" } as never);
    repository.updateDividendReceiptAsReceived.mockResolvedValue({
      id: "receipt-1",
      status: "received",
      transactionId: "tx-1",
    } as never);

    await service.receiveDividend("user-1", "portfolio-1", "receipt-1", {});

    expect(repository.createTransaction).toHaveBeenCalledWith(
      "user-1",
      "portfolio-1",
      expect.objectContaining({
        assetId: "asset-1",
        type: "dividend",
        totalAmount: dec("12.5"),
        occurredAt: new Date("2026-05-20"),
      }),
    );
    expect(repository.updateDividendEventStatus).toHaveBeenCalledWith(
      "user-1",
      "event-1",
      "received",
    );
  });

  it("builds monthly report totals for buys, sales, dividends and pending data", async () => {
    const asset = {
      id: "asset-1",
      ticker: "HGLG11",
      quotes: [{ price: dec(20), sourceType: "manual", status: "manual" }],
    };
    const buy = {
      id: "buy-1",
      assetId: "asset-1",
      type: "buy",
      quantity: dec(10),
      unitPrice: dec(10),
      totalAmount: dec(100),
      fees: dec(0),
      taxes: dec(0),
      occurredAt: new Date("2026-05-01"),
      createdAt: new Date("2026-05-01"),
      asset,
    };
    const sell = {
      id: "sell-1",
      assetId: "asset-1",
      type: "sell",
      quantity: dec(4),
      unitPrice: dec(20),
      grossAmount: dec(80),
      totalAmount: dec(78),
      fees: dec(1),
      taxes: dec(1),
      occurredAt: new Date("2026-05-10"),
      createdAt: new Date("2026-05-10"),
      asset,
    };
    const dividend = {
      id: "dividend-1",
      assetId: "asset-1",
      type: "dividend",
      quantity: null,
      unitPrice: dec("1.25"),
      totalAmount: dec("12.5"),
      fees: dec(0),
      taxes: dec(0),
      occurredAt: new Date("2026-05-20"),
      createdAt: new Date("2026-05-20"),
      asset,
    };

    repository.findById.mockResolvedValue({ id: "portfolio-1" } as never);
    repository.findPortfolioTransactionsBetween.mockResolvedValue([
      buy,
      sell,
      dividend,
    ] as never);
    repository.findPortfolioTransactionsUntil
      .mockResolvedValueOnce([buy, sell, dividend] as never)
      .mockResolvedValueOnce([] as never);
    repository.findDividendReceiptsBetween.mockResolvedValue([
      {
        id: "receipt-1",
        status: "pending",
        asset,
        paymentDate: new Date("2026-05-20"),
        totalAmount: dec("12.5"),
      },
    ] as never);

    const report = await service.getMonthlyReport("user-1", "portfolio-1", "2026-05");

    expect(report).toMatchObject({
      contributions: 100,
      sales: 78,
      dividendsReceived: 12.5,
      estimatedCapitalGain: 38,
      portfolioValue: 120,
      pendingData: {
        staleQuotes: 0,
        missingQuotes: 0,
        pendingDividends: 1,
        hasPendingData: true,
      },
    });
  });
});
