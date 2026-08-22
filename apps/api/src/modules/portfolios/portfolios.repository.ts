import { Injectable } from "@nestjs/common";
import {
  AssetClass,
  DataSourceType,
  DividendEventStatus,
  DividendReceiptStatus,
  FixedIncomeIndexer,
  PortfolioTransactionType,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

type PortfolioTransactionData = {
  assetId?: string;
  asset?: {
    ticker: string;
    name: string;
    class: AssetClass;
    sector?: string | null;
    currency: string;
    notes?: string | null;
    fixedIncomeIndexer?: FixedIncomeIndexer | null;
    fixedIncomeRate?: Prisma.Decimal | null;
    fixedIncomeBaseDate?: Date | null;
  };
  initialQuote?: {
    price: Prisma.Decimal;
    currency: string;
    source: string;
    sourceType: DataSourceType;
    status: "current" | "estimated";
    quotedAt: Date;
  } | null;
  fixedIncomeBaseDate?: Date | null;
  type: PortfolioTransactionType;
  quantity?: Prisma.Decimal | null;
  unitPrice?: Prisma.Decimal | null;
  grossAmount?: Prisma.Decimal | null;
  fees: Prisma.Decimal;
  taxes: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  currency: string;
  occurredAt: Date;
  notes?: string | null;
  source?: string;
  sourceType?: DataSourceType;
  legacyInvestmentId?: string | null;
};

type DividendReceiptWithRelations = Prisma.PortfolioDividendReceiptGetPayload<{
  include: { asset: true; event: true };
}>;

type ReceiveDividendData = {
  transaction: PortfolioTransactionData;
  receipt: {
    quantity?: Prisma.Decimal | null;
    amountPerShare: Prisma.Decimal;
    grossAmount: Prisma.Decimal;
    taxes: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    receivedAt: Date;
    notes?: string | null;
  };
};

export class InsufficientPortfolioPositionError extends Error {
  constructor() {
    super("Sell quantity exceeds the available position");
    this.name = "InsufficientPortfolioPositionError";
  }
}

export class FixedIncomeBasisChangedError extends Error {
  constructor() {
    super("Fixed-income base date changed concurrently");
    this.name = "FixedIncomeBasisChangedError";
  }
}

export class PortfolioAssetDefinitionConflictError extends Error {
  constructor() {
    super("An asset with this ticker has incompatible terms");
    this.name = "PortfolioAssetDefinitionConflictError";
  }
}

const portfolioTransactionQuantityChange = (
  type: PortfolioTransactionType,
  quantity: Prisma.Decimal | null,
) => {
  const value = quantity ?? new Prisma.Decimal(0);

  if (type === "buy" || type === "opening_balance" || type === "manual_adjustment") {
    return value;
  }

  return type === "sell" ? value.negated() : new Prisma.Decimal(0);
};

@Injectable()
export class PortfoliosRepository {
  private hasExtendedLegacyInvestmentSchema: boolean | null = null;

  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string) {
    return this.prisma.portfolio.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
  }

  findById(userId: string, id: string) {
    return this.prisma.portfolio.findFirst({ where: { userId, id } });
  }

  findDefault(userId: string) {
    return this.prisma.portfolio.findFirst({
      where: { userId, isDefault: true },
      orderBy: { createdAt: "asc" },
    });
  }

  create(userId: string, data: { name: string; isDefault?: boolean }) {
    return this.prisma.portfolio.create({
      data: {
        userId,
        name: data.name,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  findAsset(userId: string, assetId: string) {
    return this.prisma.asset.findFirst({ where: { userId, id: assetId } });
  }

  findAssetByTicker(userId: string, ticker: string) {
    return this.prisma.asset.findFirst({ where: { userId, ticker } });
  }

  async ensureDefault(userId: string) {
    const existing = await this.findDefault(userId);
    if (existing) return existing;

    return this.create(userId, { name: "Carteira principal", isDefault: true });
  }

  async findLegacyInvestments(userId: string) {
    if (this.hasExtendedLegacyInvestmentSchema === false) {
      return this.findBaseLegacyInvestments(userId);
    }

    try {
      const investments = await this.prisma.investment.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      this.hasExtendedLegacyInvestmentSchema = true;
      return investments;
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2022"
      ) {
        throw error;
      }

      this.hasExtendedLegacyInvestmentSchema = false;
      return this.findBaseLegacyInvestments(userId);
    }
  }

  private async findBaseLegacyInvestments(userId: string) {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        name: true,
        category: true,
        investedAmount: true,
        currentValue: true,
        startDate: true,
        notes: true,
        createdAt: true,
      },
    });

    return investments.map((investment) => ({
      ...investment,
      assetSymbol: null,
      quantity: null,
      averagePrice: null,
      marketPrice: null,
      marketValue: null,
      quoteProvider: null,
      quoteCurrency: null,
      quoteUpdatedAt: null,
    }));
  }

  findLegacyMigration(userId: string, legacyInvestmentId: string) {
    return this.prisma.portfolioTransaction.findFirst({
      where: { userId, legacyInvestmentId },
    });
  }

  upsertLegacyAsset(
    userId: string,
    data: {
      ticker: string;
      name: string;
      class: AssetClass;
      sector?: string | null;
      currency: string;
    },
  ) {
    return this.prisma.asset.upsert({
      where: { userId_ticker: { userId, ticker: data.ticker } },
      create: {
        userId,
        ticker: data.ticker,
        name: data.name,
        class: data.class,
        sector: data.sector ?? null,
        currency: data.currency,
        source: "legacy_manual",
        sourceType: "legacy_manual",
        status: "manual",
        observedAt: new Date(),
      },
      update: {},
    });
  }

  createLegacyQuote(userId: string, assetId: string, price: Prisma.Decimal) {
    return this.prisma.quote.create({
      data: {
        userId,
        assetId,
        price,
        currency: "BRL",
        source: "legacy_manual",
        sourceType: "legacy_manual",
        status: "manual",
        quotedAt: new Date(),
      },
    });
  }

  createTransaction(
    userId: string,
    portfolioId: string,
    data: PortfolioTransactionData,
  ) {
    return this.prisma.$transaction(async (transactionClient) => {
      let assetId = data.assetId;
      if (data.asset) {
        const asset = await transactionClient.asset.upsert({
          where: {
            userId_ticker: { userId, ticker: data.asset.ticker },
          },
          create: {
            userId,
            ticker: data.asset.ticker,
            name: data.asset.name,
            class: data.asset.class,
            sector: data.asset.sector ?? null,
            currency: data.asset.currency,
            notes: data.asset.notes ?? null,
            fixedIncomeIndexer: data.asset.fixedIncomeIndexer ?? null,
            fixedIncomeRate: data.asset.fixedIncomeRate ?? null,
            fixedIncomeBaseDate: data.asset.fixedIncomeBaseDate ?? null,
            source: "manual",
            sourceType: "manual",
            status: "manual",
            observedAt: new Date(),
          },
          update: {},
        });
        assetId = asset.id;

        const rateMatches =
          asset.fixedIncomeRate === null && !data.asset.fixedIncomeRate
            ? true
            : asset.fixedIncomeRate !== null && data.asset.fixedIncomeRate
              ? asset.fixedIncomeRate.equals(data.asset.fixedIncomeRate)
              : false;
        if (
          asset.class !== data.asset.class ||
          asset.currency !== data.asset.currency ||
          asset.fixedIncomeIndexer !== (data.asset.fixedIncomeIndexer ?? null) ||
          !rateMatches
        ) {
          throw new PortfolioAssetDefinitionConflictError();
        }

        if (
          data.asset.fixedIncomeBaseDate &&
          asset.fixedIncomeBaseDate &&
          asset.fixedIncomeBaseDate.getTime() !==
            data.asset.fixedIncomeBaseDate.getTime()
        ) {
          throw new FixedIncomeBasisChangedError();
        }

        if (data.initialQuote) {
          await transactionClient.quote.create({
            data: {
              userId,
              assetId,
              price: data.initialQuote.price,
              currency: data.initialQuote.currency,
              source: data.initialQuote.source,
              sourceType: data.initialQuote.sourceType,
              status: data.initialQuote.status,
              quotedAt: data.initialQuote.quotedAt,
            },
          });
        }
      }

      if (!assetId) throw new Error("Portfolio transaction requires an asset");

      if (data.fixedIncomeBaseDate && !data.asset) {
        const claimed = await transactionClient.asset.updateMany({
          where: { id: assetId, userId, fixedIncomeBaseDate: null },
          data: { fixedIncomeBaseDate: data.fixedIncomeBaseDate },
        });
        if (claimed.count === 0) {
          const persisted = await transactionClient.asset.findFirst({
            where: { id: assetId, userId },
            select: { fixedIncomeBaseDate: true },
          });
          if (
            persisted?.fixedIncomeBaseDate &&
            persisted.fixedIncomeBaseDate.getTime() !==
              data.fixedIncomeBaseDate.getTime()
          ) {
            throw new FixedIncomeBasisChangedError();
          }
        }
      }

      if (data.type === "sell") {
        const lockKey = `${userId}:${portfolioId}:${assetId}`;
        await transactionClient.$queryRaw(
          Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`,
        );

        const existing = await transactionClient.portfolioTransaction.findMany({
          where: { userId, portfolioId, assetId },
          select: { type: true, quantity: true, occurredAt: true, createdAt: true },
          orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
        });
        const candidateCreatedAt = new Date(8_640_000_000_000_000);
        const chronological = [
          ...existing.map((transaction) => ({
            ...transaction,
            isCandidate: false,
          })),
          {
            type: data.type,
            quantity: data.quantity ?? null,
            occurredAt: data.occurredAt,
            createdAt: candidateCreatedAt,
            isCandidate: true,
          },
        ].sort(
          (left, right) =>
            left.occurredAt.getTime() - right.occurredAt.getTime() ||
            left.createdAt.getTime() - right.createdAt.getTime(),
        );

        let available = new Prisma.Decimal(0);
        let candidateReached = false;
        for (const transaction of chronological) {
          candidateReached ||= transaction.isCandidate;
          available = available.plus(
            portfolioTransactionQuantityChange(transaction.type, transaction.quantity),
          );
          if (candidateReached && available.isNegative()) {
            throw new InsufficientPortfolioPositionError();
          }
        }
      }

      return transactionClient.portfolioTransaction.create({
        data: {
          userId,
          portfolioId,
          assetId,
          type: data.type,
          quantity: data.quantity ?? null,
          unitPrice: data.unitPrice ?? null,
          grossAmount: data.grossAmount ?? null,
          fees: data.fees,
          taxes: data.taxes,
          totalAmount: data.totalAmount,
          currency: data.currency,
          occurredAt: data.occurredAt,
          notes: data.notes ?? null,
          source: data.source ?? "manual",
          sourceType: data.sourceType ?? "manual",
          status: "manual",
          legacyInvestmentId: data.legacyInvestmentId ?? null,
        },
      });
    });
  }

  findPortfolioTransactions(userId: string, portfolioId: string) {
    return this.prisma.portfolioTransaction.findMany({
      where: { userId, portfolioId },
      include: {
        asset: {
          include: {
            quotes: {
              orderBy: { quotedAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
    });
  }

  findPortfolioTransactionsBetween(
    userId: string,
    portfolioId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.portfolioTransaction.findMany({
      where: {
        userId,
        portfolioId,
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { asset: true },
      orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
    });
  }

  findPortfolioTransactionsUntil(
    userId: string,
    portfolioId: string,
    endDate: Date,
  ) {
    return this.prisma.portfolioTransaction.findMany({
      where: {
        userId,
        portfolioId,
        occurredAt: { lte: endDate },
      },
      include: {
        asset: {
          include: {
            quotes: {
              where: { quotedAt: { lte: endDate } },
              orderBy: { quotedAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
    });
  }

  createDividendEvent(
    userId: string,
    data: {
      assetId: string;
      source: string;
      status: DividendEventStatus;
      exDate?: Date | null;
      paymentDate: Date;
      amountPerShare: Prisma.Decimal;
      currency: string;
      notes?: string | null;
    },
  ) {
    return this.prisma.dividendEvent.create({
      data: {
        userId,
        assetId: data.assetId,
        source: data.source,
        sourceType: "manual",
        status: data.status,
        exDate: data.exDate ?? null,
        paymentDate: data.paymentDate,
        amountPerShare: data.amountPerShare,
        currency: data.currency,
        notes: data.notes ?? null,
      },
    });
  }

  createDividendReceipt(
    userId: string,
    portfolioId: string,
    data: {
      assetId: string;
      dividendEventId?: string | null;
      quantity?: Prisma.Decimal | null;
      amountPerShare: Prisma.Decimal;
      grossAmount?: Prisma.Decimal | null;
      taxes: Prisma.Decimal;
      totalAmount?: Prisma.Decimal | null;
      currency: string;
      exDate?: Date | null;
      paymentDate: Date;
      notes?: string | null;
      source: string;
    },
  ) {
    return this.prisma.portfolioDividendReceipt.create({
      data: {
        userId,
        portfolioId,
        assetId: data.assetId,
        dividendEventId: data.dividendEventId ?? null,
        status: "pending",
        quantity: data.quantity ?? null,
        amountPerShare: data.amountPerShare,
        grossAmount: data.grossAmount ?? null,
        taxes: data.taxes,
        totalAmount: data.totalAmount ?? null,
        currency: data.currency,
        exDate: data.exDate ?? null,
        paymentDate: data.paymentDate,
        notes: data.notes ?? null,
        source: data.source,
        sourceType: "manual",
      },
      include: {
        asset: true,
        event: true,
      },
    });
  }

  findDividendReceipt(userId: string, portfolioId: string, receiptId: string) {
    return this.prisma.portfolioDividendReceipt.findFirst({
      where: { userId, portfolioId, id: receiptId },
      include: {
        asset: true,
        event: true,
      },
    });
  }

  findDividendReceipts(userId: string, portfolioId: string) {
    return this.prisma.portfolioDividendReceipt.findMany({
      where: { userId, portfolioId },
      include: {
        asset: true,
        event: true,
      },
      orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
    });
  }

  findDividendReceiptsBetween(
    userId: string,
    portfolioId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.portfolioDividendReceipt.findMany({
      where: {
        userId,
        portfolioId,
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        asset: true,
        event: true,
      },
      orderBy: [{ paymentDate: "asc" }, { createdAt: "asc" }],
    });
  }

  receiveDividendAtomically(
    userId: string,
    portfolioId: string,
    receiptId: string,
    prepare: (receipt: DividendReceiptWithRelations) => ReceiveDividendData,
  ) {
    return this.prisma.$transaction(async (transactionClient) => {
      const receipt = await transactionClient.portfolioDividendReceipt.findFirst({
        where: { userId, portfolioId, id: receiptId },
        include: {
          asset: true,
          event: true,
        },
      });

      if (!receipt || receipt.status !== "pending") return receipt;

      const claim = await transactionClient.portfolioDividendReceipt.updateMany({
        where: { userId, portfolioId, id: receiptId, status: "pending" },
        data: { status: "received" },
      });

      if (claim.count !== 1) {
        return transactionClient.portfolioDividendReceipt.findFirst({
          where: { userId, portfolioId, id: receiptId },
          include: {
            asset: true,
            event: true,
          },
        });
      }

      const data = prepare(receipt);
      const ledgerTransaction = await transactionClient.portfolioTransaction.create({
        data: {
          userId,
          portfolioId,
          assetId: data.transaction.assetId,
          type: data.transaction.type,
          quantity: data.transaction.quantity ?? null,
          unitPrice: data.transaction.unitPrice ?? null,
          grossAmount: data.transaction.grossAmount ?? null,
          fees: data.transaction.fees,
          taxes: data.transaction.taxes,
          totalAmount: data.transaction.totalAmount,
          currency: data.transaction.currency,
          occurredAt: data.transaction.occurredAt,
          notes: data.transaction.notes ?? null,
          source: data.transaction.source ?? "manual",
          sourceType: data.transaction.sourceType ?? "manual",
          status: "manual",
          legacyInvestmentId: data.transaction.legacyInvestmentId ?? null,
        },
      });
      const updated = await transactionClient.portfolioDividendReceipt.update({
        where: { id: receiptId },
        data: {
          quantity: data.receipt.quantity ?? null,
          amountPerShare: data.receipt.amountPerShare,
          grossAmount: data.receipt.grossAmount,
          taxes: data.receipt.taxes,
          totalAmount: data.receipt.totalAmount,
          receivedAt: data.receipt.receivedAt,
          transactionId: ledgerTransaction.id,
          notes: data.receipt.notes ?? undefined,
        },
        include: {
          asset: true,
          event: true,
        },
      });

      if (receipt.dividendEventId) {
        await transactionClient.dividendEvent.updateMany({
          where: { userId, id: receipt.dividendEventId },
          data: { status: "received" },
        });
      }

      return updated;
    });
  }
}
