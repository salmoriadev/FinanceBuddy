import { Injectable } from "@nestjs/common";
import { AssetClass, DataSourceType, Prisma, QuoteStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class AssetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string) {
    return this.prisma.asset.findMany({
      where: { userId },
      include: {
        quotes: {
          orderBy: { quotedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { ticker: "asc" },
    });
  }

  findByTicker(userId: string, ticker: string) {
    return this.prisma.asset.findFirst({
      where: { userId, ticker },
      include: {
        quotes: {
          orderBy: { quotedAt: "desc" },
          take: 1,
        },
      },
    });
  }

  findById(userId: string, id: string) {
    return this.prisma.asset.findFirst({
      where: { userId, id },
      include: {
        quotes: {
          orderBy: { quotedAt: "desc" },
          take: 1,
        },
      },
    });
  }

  create(
    userId: string,
    data: {
      ticker: string;
      name: string;
      class: AssetClass;
      sector?: string | null;
      currency: string;
      notes?: string | null;
    },
  ) {
    return this.prisma.asset.create({
      data: {
        userId,
        ticker: data.ticker,
        name: data.name,
        class: data.class,
        sector: data.sector ?? null,
        currency: data.currency,
        notes: data.notes ?? null,
        source: "manual",
        sourceType: "manual",
        status: "manual",
        observedAt: new Date(),
      },
      include: {
        quotes: {
          orderBy: { quotedAt: "desc" },
          take: 1,
        },
      },
    });
  }

  upsertProvider(
    userId: string,
    name: string,
    sourceType: DataSourceType = "manual",
    status: QuoteStatus = "current",
  ) {
    return this.prisma.dataProvider.upsert({
      where: { userId_name: { userId, name } },
      create: {
        userId,
        name,
        sourceType,
        status,
      },
      update: {},
    });
  }

  upsertManualProvider(userId: string, name: string) {
    return this.upsertProvider(userId, name, "manual", "current");
  }

  createQuote(
    userId: string,
    assetId: string,
    data: {
      providerId?: string | null;
      price: Prisma.Decimal;
      currency: string;
      source: string;
      sourceType: DataSourceType;
      status: QuoteStatus;
      quotedAt: Date;
    },
  ) {
    return this.prisma.quote.create({
      data: {
        userId,
        assetId,
        providerId: data.providerId ?? null,
        price: data.price,
        currency: data.currency,
        source: data.source,
        sourceType: data.sourceType,
        status: data.status,
        quotedAt: data.quotedAt,
      },
    });
  }

  findLatestQuote(userId: string, assetId: string) {
    return this.prisma.quote.findFirst({
      where: { userId, assetId },
      orderBy: { quotedAt: "desc" },
    });
  }
}
