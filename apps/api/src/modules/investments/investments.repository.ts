/**
 * Provides user-scoped data access for investment entities and keeps persistence
 * concerns isolated from investment business rules.
 */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { runUpdateAndFind } from "../../database/repository-helpers";

type InvestmentModel = {
  create: (args: Record<string, unknown>) => Promise<unknown>;
  findMany: (args: Record<string, unknown>) => Promise<any[]>;
  updateMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
  findFirst: (args: Record<string, unknown>) => Promise<any | null>;
};

@Injectable()
export class InvestmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get investments() {
    return this.prisma.investment as unknown as InvestmentModel;
  }

  findAllByUser(userId: string) {
    return this.investments.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  create(userId: string, data: {
    name: string;
    category?: string | null;
    assetSymbol?: string | null;
    quantity?: number | null;
    averagePrice?: number | null;
    investedAmount: number;
    currentValue: number;
    marketPrice?: number | null;
    marketValue?: number | null;
    quoteProvider?: string | null;
    quoteCurrency?: string | null;
    quoteUpdatedAt?: Date | null;
    startDate?: Date | null;
    notes?: string | null;
  }) {
    return this.investments.create({
      data: {
        userId,
        name: data.name,
        category: data.category ?? null,
        assetSymbol: data.assetSymbol ?? null,
        quantity: data.quantity ?? null,
        averagePrice: data.averagePrice ?? null,
        investedAmount: data.investedAmount,
        currentValue: data.currentValue,
        marketPrice: data.marketPrice ?? null,
        marketValue: data.marketValue ?? null,
        quoteProvider: data.quoteProvider ?? null,
        quoteCurrency: data.quoteCurrency ?? null,
        quoteUpdatedAt: data.quoteUpdatedAt ?? null,
        startDate: data.startDate ?? null,
        notes: data.notes ?? null,
      },
    });
  }

  update(userId: string, id: string, data: {
    name?: string;
    category?: string | null;
    assetSymbol?: string | null;
    quantity?: number | null;
    averagePrice?: number | null;
    investedAmount?: number;
    currentValue?: number;
    marketPrice?: number | null;
    marketValue?: number | null;
    quoteProvider?: string | null;
    quoteCurrency?: string | null;
    quoteUpdatedAt?: Date | null;
    startDate?: Date | null;
    notes?: string | null;
  }) {
    return runUpdateAndFind(
      () =>
        this.investments.updateMany({
          where: { id, userId },
          data,
        }),
      () => this.investments.findFirst({ where: { id, userId } }),
    );
  }

  findQuotedPositions(userId: string, ids?: string[]) {
    return this.investments.findMany({
      where: {
        userId,
        assetSymbol: { not: null },
        quantity: { not: null },
        ...(ids?.length ? { id: { in: ids } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateMarketSnapshot(
    userId: string,
    id: string,
    data: {
      currentValue: number;
      marketPrice: number;
      marketValue: number;
      quoteProvider: string;
      quoteCurrency: string;
      quoteUpdatedAt: Date;
    },
  ) {
    await this.investments.updateMany({
      where: { id, userId },
      data,
    });
    return this.investments.findFirst({ where: { id, userId } });
  }

  delete(userId: string, id: string) {
    return this.prisma.investment.deleteMany({ where: { id, userId } });
  }
}
