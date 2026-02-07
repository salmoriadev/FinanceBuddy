/**
 * Builds financial report summaries by combining recurring transaction materialization
 * with cached, database-aggregated totals for the requested year.
 */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RecurringTransactionsService } from "../transactions/recurring.service";
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly recurring: RecurringTransactionsService,
  ) {}

  private async getYearlyTotals(userId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const groupedByType = await this.prisma.transaction.groupBy({
      by: ["type"],
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    let income = 0;
    let expense = 0;

    groupedByType.forEach((entry) => {
      const amount = Number(entry._sum.amount ?? 0);
      if (entry.type === "income") {
        income = amount;
      } else {
        expense = amount;
      }
    });

    return { income, expense };
  }

  async getSummary(userId: string, year?: number) {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const cacheKey = `${userId}:${targetYear}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    await this.recurring.ensureRecurringTransactions(userId);

    const { income, expense } = await this.getYearlyTotals(userId, targetYear);

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
