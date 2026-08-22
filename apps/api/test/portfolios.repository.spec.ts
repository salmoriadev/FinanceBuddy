import { Prisma } from "@prisma/client";
import { PrismaService } from "../src/database/prisma.service";
import {
  FixedIncomeBasisChangedError,
  InsufficientPortfolioPositionError,
  PortfoliosRepository,
} from "../src/modules/portfolios/portfolios.repository";

const dec = (value: string | number) => new Prisma.Decimal(value);

describe("PortfoliosRepository legacy investment compatibility", () => {
  it("falls back to the base investment schema after a missing-column error", async () => {
    const missingColumn = new Prisma.PrismaClientKnownRequestError(
      "The column investments.asset_symbol does not exist",
      {
        code: "P2022",
        clientVersion: "5.22.0",
        meta: { modelName: "Investment", column: "investments.asset_symbol" },
      },
    );
    const baseInvestment = {
      id: "investment-1",
      userId: "user-1",
      name: "Reserva",
      category: "Renda fixa",
      investedAmount: dec(1000),
      currentValue: dec(1050),
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      notes: null,
      createdAt: new Date("2026-01-01T10:00:00.000Z"),
    };
    const findMany = jest
      .fn()
      .mockRejectedValueOnce(missingColumn)
      .mockResolvedValue([baseInvestment]);
    const prisma = {
      investment: { findMany },
    } as unknown as PrismaService;
    const repository = new PortfoliosRepository(prisma);

    await expect(repository.findLegacyInvestments("user-1")).resolves.toEqual([
      {
        ...baseInvestment,
        assetSymbol: null,
        quantity: null,
        averagePrice: null,
        marketPrice: null,
        marketValue: null,
        quoteProvider: null,
        quoteCurrency: null,
        quoteUpdatedAt: null,
      },
    ]);
    await repository.findLegacyInvestments("user-1");

    expect(findMany).toHaveBeenNthCalledWith(1, {
      where: { userId: "user-1" },
      orderBy: { createdAt: "asc" },
    });
    expect(findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { userId: "user-1" },
        select: expect.objectContaining({
          id: true,
          investedAmount: true,
          currentValue: true,
        }),
      }),
    );
    expect(findMany).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ select: expect.any(Object) }),
    );
  });

  it("does not hide non-schema database failures", async () => {
    const failure = new Prisma.PrismaClientKnownRequestError(
      "Database constraint failed",
      { code: "P2004", clientVersion: "5.22.0" },
    );
    const prisma = {
      investment: { findMany: jest.fn().mockRejectedValue(failure) },
    } as unknown as PrismaService;
    const repository = new PortfoliosRepository(prisma);

    await expect(repository.findLegacyInvestments("user-1")).rejects.toBe(failure);
  });
});

const pendingReceipt = {
  id: "receipt-1",
  userId: "user-1",
  portfolioId: "portfolio-1",
  assetId: "asset-1",
  dividendEventId: "event-1",
  status: "pending",
  quantity: dec(10),
  amountPerShare: dec("1.25"),
  grossAmount: null,
  taxes: dec(0),
  totalAmount: null,
  currency: "BRL",
  exDate: null,
  paymentDate: new Date("2026-05-20"),
  receivedAt: null,
  transactionId: null,
  notes: null,
  source: "manual",
  sourceType: "manual",
  createdAt: new Date("2026-05-01"),
  updatedAt: new Date("2026-05-01"),
  asset: { id: "asset-1" },
  event: { id: "event-1" },
};

const preparedDividend = {
  transaction: {
    assetId: "asset-1",
    type: "dividend" as const,
    quantity: null,
    unitPrice: dec("1.25"),
    grossAmount: dec("12.5"),
    fees: dec(0),
    taxes: dec(0),
    totalAmount: dec("12.5"),
    currency: "BRL",
    occurredAt: new Date("2026-05-20"),
  },
  receipt: {
    quantity: dec(10),
    amountPerShare: dec("1.25"),
    grossAmount: dec("12.5"),
    taxes: dec(0),
    totalAmount: dec("12.5"),
    receivedAt: new Date("2026-05-20"),
  },
};

describe("PortfoliosRepository.receiveDividendAtomically", () => {
  it("allows only one concurrent pending-to-received claimant to create a ledger entry", async () => {
    const receivedReceipt = {
      ...pendingReceipt,
      status: "received",
      transactionId: "tx-1",
    };
    const transactionClient = {
      portfolioDividendReceipt: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(pendingReceipt)
          .mockResolvedValueOnce(pendingReceipt)
          .mockResolvedValueOnce(receivedReceipt),
        updateMany: jest
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
        update: jest.fn().mockResolvedValue(receivedReceipt),
      },
      portfolioTransaction: {
        create: jest.fn().mockResolvedValue({ id: "tx-1" }),
      },
      dividendEvent: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transactionClient)),
    } as unknown as PrismaService;
    const repository = new PortfoliosRepository(prisma);
    const prepare = jest.fn(() => preparedDividend);

    const [first, second] = await Promise.all([
      repository.receiveDividendAtomically(
        "user-1",
        "portfolio-1",
        "receipt-1",
        prepare as never,
      ),
      repository.receiveDividendAtomically(
        "user-1",
        "portfolio-1",
        "receipt-1",
        prepare as never,
      ),
    ]);

    expect(first).toEqual(receivedReceipt);
    expect(second).toEqual(receivedReceipt);
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(transactionClient.portfolioTransaction.create).toHaveBeenCalledTimes(1);
    expect(transactionClient.portfolioDividendReceipt.update).toHaveBeenCalledTimes(1);
    expect(transactionClient.portfolioDividendReceipt.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        portfolioId: "portfolio-1",
        id: "receipt-1",
        status: "pending",
      },
      data: { status: "received" },
    });
  });

  it("rolls back a failed ledger write so the receipt can be retried without an orphan", async () => {
    let committed = {
      status: "pending",
      transactionId: null as string | null,
      ledgerIds: [] as string[],
    };
    let failLedgerWrite = true;
    const prisma = {
      $transaction: jest.fn(async (callback) => {
        const draft = {
          status: committed.status,
          transactionId: committed.transactionId,
          ledgerIds: [...committed.ledgerIds],
        };
        const transactionClient = {
          portfolioDividendReceipt: {
            findFirst: jest.fn(async () => ({
              ...pendingReceipt,
              status: draft.status,
              transactionId: draft.transactionId,
            })),
            updateMany: jest.fn(async () => {
              if (draft.status !== "pending") return { count: 0 };
              draft.status = "received";
              return { count: 1 };
            }),
            update: jest.fn(async ({ data }) => {
              draft.transactionId = data.transactionId;
              return {
                ...pendingReceipt,
                status: draft.status,
                transactionId: draft.transactionId,
              };
            }),
          },
          portfolioTransaction: {
            create: jest.fn(async () => {
              if (failLedgerWrite) throw new Error("ledger unavailable");
              draft.ledgerIds.push("tx-1");
              return { id: "tx-1" };
            }),
          },
          dividendEvent: {
            updateMany: jest.fn(async () => ({ count: 1 })),
          },
        };

        const result = await callback(transactionClient);
        committed = draft;
        return result;
      }),
    } as unknown as PrismaService;
    const repository = new PortfoliosRepository(prisma);

    await expect(
      repository.receiveDividendAtomically(
        "user-1",
        "portfolio-1",
        "receipt-1",
        () => preparedDividend,
      ),
    ).rejects.toThrow("ledger unavailable");
    expect(committed).toEqual({
      status: "pending",
      transactionId: null,
      ledgerIds: [],
    });

    failLedgerWrite = false;
    await expect(
      repository.receiveDividendAtomically(
        "user-1",
        "portfolio-1",
        "receipt-1",
        () => preparedDividend,
      ),
    ).resolves.toEqual(expect.objectContaining({
      status: "received",
      transactionId: "tx-1",
    }));
    expect(committed).toEqual({
      status: "received",
      transactionId: "tx-1",
      ledgerIds: ["tx-1"],
    });
  });
});

describe("PortfoliosRepository.createTransaction asset atomicity", () => {
  it("creates a searched asset, its initial quote, and the event in one transaction", async () => {
    const assetCreate = jest.fn().mockResolvedValue({
      id: "asset-1",
      class: "fii",
      currency: "BRL",
      fixedIncomeIndexer: null,
      fixedIncomeRate: null,
      fixedIncomeBaseDate: null,
    });
    const quoteCreate = jest.fn().mockResolvedValue({ id: "quote-1" });
    const portfolioTransactionCreate = jest
      .fn()
      .mockResolvedValue({ id: "transaction-1" });
    const transactionClient = {
      asset: { upsert: assetCreate },
      quote: { create: quoteCreate },
      portfolioTransaction: { create: portfolioTransactionCreate },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transactionClient)),
    } as unknown as PrismaService;
    const repository = new PortfoliosRepository(prisma);

    await repository.createTransaction("user-1", "portfolio-1", {
      asset: {
        ticker: "HGLG11",
        name: "Pátria Log FII",
        class: "fii",
        currency: "BRL",
      },
      initialQuote: {
        price: dec("147.21"),
        currency: "BRL",
        source: "brapi",
        sourceType: "external",
        status: "current",
        quotedAt: new Date("2026-08-22T12:00:00.000Z"),
      },
      type: "buy",
      quantity: dec(10),
      unitPrice: dec("147.21"),
      grossAmount: dec("1472.10"),
      fees: dec(0),
      taxes: dec(0),
      totalAmount: dec("1472.10"),
      currency: "BRL",
      occurredAt: new Date("2026-08-22T00:00:00.000Z"),
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(assetCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ ticker: "HGLG11", userId: "user-1" }),
      }),
    );
    expect(quoteCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assetId: "asset-1", price: dec("147.21") }),
      }),
    );
    expect(portfolioTransactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assetId: "asset-1",
          portfolioId: "portfolio-1",
        }),
      }),
    );
  });

  it("rejects a concurrently changed fixed-income base so the service can recalculate", async () => {
    const transactionClient = {
      asset: {
        upsert: jest.fn().mockResolvedValue({
          id: "asset-1",
          class: "fixed_income",
          currency: "BRL",
          fixedIncomeIndexer: "fixed",
          fixedIncomeRate: dec(15),
          fixedIncomeBaseDate: new Date("2026-01-01T00:00:00.000Z"),
        }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transactionClient)),
    } as unknown as PrismaService;
    const repository = new PortfoliosRepository(prisma);

    await expect(
      repository.createTransaction("user-1", "portfolio-1", {
        asset: {
          ticker: "CDB-2028",
          name: "CDB 2028",
          class: "fixed_income",
          currency: "BRL",
          fixedIncomeIndexer: "fixed",
          fixedIncomeRate: dec(15),
          fixedIncomeBaseDate: new Date("2026-02-01T00:00:00.000Z"),
        },
        type: "buy",
        quantity: dec(1000),
        unitPrice: dec(1),
        grossAmount: dec(1000),
        fees: dec(0),
        taxes: dec(0),
        totalAmount: dec(1000),
        currency: "BRL",
        occurredAt: new Date("2026-02-01T00:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(FixedIncomeBasisChangedError);
  });
});

describe("PortfoliosRepository.createTransaction position guard", () => {
  const transactionData = (quantity: string, occurredAt: string) => ({
    assetId: "asset-1",
    type: "sell" as const,
    quantity: dec(quantity),
    unitPrice: dec(10),
    grossAmount: dec(quantity).times(10),
    fees: dec(0),
    taxes: dec(0),
    totalAmount: dec(quantity).times(10),
    currency: "BRL",
    occurredAt: new Date(occurredAt),
  });

  it("rejects a backdated sale that would make a later position negative", async () => {
    const create = jest.fn();
    const transactionClient = {
      $queryRaw: jest.fn().mockResolvedValue([{ pg_advisory_xact_lock: null }]),
      portfolioTransaction: {
        findMany: jest.fn().mockResolvedValue([
          {
            type: "buy",
            quantity: dec(10),
            occurredAt: new Date("2026-01-01T00:00:00.000Z"),
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
          {
            type: "sell",
            quantity: dec(5),
            occurredAt: new Date("2026-01-03T00:00:00.000Z"),
            createdAt: new Date("2026-01-03T10:00:00.000Z"),
          },
        ]),
        create,
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transactionClient)),
    } as unknown as PrismaService;
    const repository = new PortfoliosRepository(prisma);

    await expect(
      repository.createTransaction(
        "user-1",
        "portfolio-1",
        transactionData("6", "2026-01-02T00:00:00.000Z"),
      ),
    ).rejects.toBeInstanceOf(InsufficientPortfolioPositionError);
    expect(create).not.toHaveBeenCalled();
    expect(transactionClient.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("allows a current sale after a legacy negative prefix was restored", async () => {
    const create = jest.fn(async ({ data }) => ({ id: "transaction-4", ...data }));
    const transactionClient = {
      $queryRaw: jest.fn().mockResolvedValue([{ pg_advisory_xact_lock: null }]),
      portfolioTransaction: {
        findMany: jest.fn().mockResolvedValue([
          {
            type: "buy",
            quantity: dec(10),
            occurredAt: new Date("2026-01-01T00:00:00.000Z"),
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
          {
            type: "sell",
            quantity: dec(15),
            occurredAt: new Date("2026-01-02T00:00:00.000Z"),
            createdAt: new Date("2026-01-02T10:00:00.000Z"),
          },
          {
            type: "buy",
            quantity: dec(10),
            occurredAt: new Date("2026-01-03T00:00:00.000Z"),
            createdAt: new Date("2026-01-03T10:00:00.000Z"),
          },
        ]),
        create,
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transactionClient)),
    } as unknown as PrismaService;
    const repository = new PortfoliosRepository(prisma);

    await expect(
      repository.createTransaction(
        "user-1",
        "portfolio-1",
        transactionData("1", "2026-01-04T00:00:00.000Z"),
      ),
    ).resolves.toEqual(expect.objectContaining({ id: "transaction-4" }));
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("serializes concurrent sales so only the quantity still available can be sold", async () => {
    const persisted = [
      {
        type: "buy",
        quantity: dec(10),
        occurredAt: new Date("2026-01-01T00:00:00.000Z"),
        createdAt: new Date("2026-01-01T10:00:00.000Z"),
      },
    ];
    const transactionClient = {
      $queryRaw: jest.fn().mockResolvedValue([{ pg_advisory_xact_lock: null }]),
      portfolioTransaction: {
        findMany: jest.fn(async () => [...persisted]),
        create: jest.fn(async ({ data }) => {
          const created = {
            ...data,
            id: `transaction-${persisted.length}`,
            createdAt: new Date(`2026-01-02T10:00:0${persisted.length}.000Z`),
          };
          persisted.push(created);
          return created;
        }),
      },
    };
    let transactionQueue = Promise.resolve<unknown>(undefined);
    const prisma = {
      $transaction: jest.fn((callback) => {
        const result = transactionQueue.then(() => callback(transactionClient));
        transactionQueue = result.then(
          () => undefined,
          () => undefined,
        );
        return result;
      }),
    } as unknown as PrismaService;
    const repository = new PortfoliosRepository(prisma);

    const results = await Promise.allSettled([
      repository.createTransaction(
        "user-1",
        "portfolio-1",
        transactionData("6", "2026-01-02T00:00:00.000Z"),
      ),
      repository.createTransaction(
        "user-1",
        "portfolio-1",
        transactionData("5", "2026-01-02T00:00:00.000Z"),
      ),
    ]);

    expect(results[0].status).toBe("fulfilled");
    expect(results[1]).toEqual(
      expect.objectContaining({
        status: "rejected",
        reason: expect.any(InsufficientPortfolioPositionError),
      }),
    );
    expect(transactionClient.portfolioTransaction.create).toHaveBeenCalledTimes(1);
    expect(transactionClient.$queryRaw).toHaveBeenCalledTimes(2);
  });
});

describe("PortfoliosRepository historical quotes", () => {
  it("selects the latest quote at or before the report boundary", async () => {
    const historicalQuote = {
      id: "quote-before",
      price: dec(20),
      quotedAt: new Date("2026-05-31T20:00:00.000Z"),
    };
    const futureQuote = {
      id: "quote-after",
      price: dec(200),
      quotedAt: new Date("2026-06-01T10:00:00.000Z"),
    };
    const findMany = jest.fn(async (query) => {
      const endDate = query.include.asset.include.quotes.where.quotedAt.lte;
      const quotes = [futureQuote, historicalQuote]
        .filter((quote) => quote.quotedAt <= endDate)
        .sort((left, right) => right.quotedAt.getTime() - left.quotedAt.getTime())
        .slice(0, query.include.asset.include.quotes.take);

      return [{ id: "buy-1", asset: { id: "asset-1", quotes } }];
    });
    const prisma = {
      portfolioTransaction: { findMany },
    } as unknown as PrismaService;
    const repository = new PortfoliosRepository(prisma);
    const periodEnd = new Date("2026-05-31T23:59:59.999Z");

    const transactions = await repository.findPortfolioTransactionsUntil(
      "user-1",
      "portfolio-1",
      periodEnd,
    );

    expect(transactions[0].asset.quotes).toEqual([historicalQuote]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          asset: {
            include: {
              quotes: {
                where: { quotedAt: { lte: periodEnd } },
                orderBy: { quotedAt: "desc" },
                take: 1,
              },
            },
          },
        },
      }),
    );
  });
});
