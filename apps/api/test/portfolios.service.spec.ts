import { Prisma } from "@prisma/client";
import { AssetsService } from "../src/modules/assets/assets.service";
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
  } as unknown as jest.Mocked<PortfoliosRepository>;

  const assetsService = {
    refreshQuote: jest.fn(),
  } as unknown as jest.Mocked<AssetsService>;

  const service = new PortfoliosService(repository, assetsService);

  beforeEach(() => {
    jest.clearAllMocks();
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
      totalAmount: dec(80),
      fees: dec(0),
      taxes: dec(0),
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
      sales: 80,
      dividendsReceived: 12.5,
      estimatedCapitalGain: 40,
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
