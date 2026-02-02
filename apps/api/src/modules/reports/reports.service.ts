import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { TtlCache } from "../../common/cache/ttl-cache";

@Injectable()
export class ReportsService {
  private readonly cache = new TtlCache<string, {
    year: number;
    income: number;
    expense: number;
    balance: number;
    savingsRate: number;
  }>(30_000);

  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string, year?: number) {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const cacheKey = `${userId}:${targetYear}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const start = new Date(targetYear, 0, 1);
    const end = new Date(targetYear + 1, 0, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
    });

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    const summary = {
      year: targetYear,
      income,
      expense,
      balance,
      savingsRate,
    };

    this.cache.set(cacheKey, summary);
    return summary;
  }
}
