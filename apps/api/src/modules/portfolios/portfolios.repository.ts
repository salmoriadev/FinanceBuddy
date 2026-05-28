import { Injectable } from "@nestjs/common";
import {
  AssetClass,
  DataSourceType,
  DividendEventStatus,
  DividendReceiptStatus,
  PortfolioTransactionType,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class PortfoliosRepository {
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

  async ensureDefault(userId: string) {
    const existing = await this.findDefault(userId);
    if (existing) return existing;

    return this.create(userId, { name: "Carteira principal", isDefault: true });
  }

  findLegacyInvestments(userId: string) {
    return this.prisma.investment.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
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
    data: {
      assetId: string;
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
    },
  ) {
    return this.prisma.portfolioTransaction.create({
      data: {
        userId,
        portfolioId,
        assetId: data.assetId,
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

  updateDividendReceiptAsReceived(
    userId: string,
    receiptId: string,
    data: {
      quantity?: Prisma.Decimal | null;
      amountPerShare: Prisma.Decimal;
      grossAmount: Prisma.Decimal;
      taxes: Prisma.Decimal;
      totalAmount: Prisma.Decimal;
      receivedAt: Date;
      transactionId: string;
      notes?: string | null;
    },
  ) {
    return this.prisma.portfolioDividendReceipt.update({
      where: { id: receiptId, userId },
      data: {
        status: "received",
        quantity: data.quantity ?? null,
        amountPerShare: data.amountPerShare,
        grossAmount: data.grossAmount,
        taxes: data.taxes,
        totalAmount: data.totalAmount,
        receivedAt: data.receivedAt,
        transactionId: data.transactionId,
        notes: data.notes ?? undefined,
      },
      include: {
        asset: true,
        event: true,
      },
    });
  }

  updateDividendEventStatus(
    userId: string,
    eventId: string,
    status: DividendEventStatus,
  ) {
    return this.prisma.dividendEvent.updateMany({
      where: { userId, id: eventId },
      data: { status },
    });
  }
}
