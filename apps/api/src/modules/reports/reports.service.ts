/**
 * Builds financial report summaries by combining recurring transaction materialization
 * with database-aggregated totals for the requested year.
 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { RecurringTransactionsService } from "../transactions/recurring.service";

type ReportSummary = {
  year: number;
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
};

type ReportMonthlyItem = {
  month: number;
  income: number;
  expense: number;
  balance: number;
};

type ReportCategorySpending = {
  name: string;
  type: "income" | "expense";
  color: string;
  value: number;
};

type ReportCurrentMonthComparison = {
  currentExpense: number;
  lastExpense: number;
  variation: number | null;
  hasVariationBaseline: boolean;
};

type ReportCurrentMonthCategory = {
  categoryId: string;
  name: string;
  type: "income" | "expense";
  color: string;
  value: number;
};

type ReportsAnalytics = {
  year: number;
  summary: ReportSummary;
  monthly: ReportMonthlyItem[];
  categories: ReportCategorySpending[];
  currentMonthComparison: ReportCurrentMonthComparison;
  currentMonthCategories: ReportCurrentMonthCategory[];
  availableYears: number[];
};

type MonthlyTotalsRow = {
  month: number;
  income: unknown;
  expense: unknown;
};

type CategorySpendingRow = {
  name: string;
  type: "income" | "expense";
  color: string;
  value: unknown;
};

type MonthComparisonRow = {
  current_expense: unknown;
  last_expense: unknown;
};

type CurrentMonthCategoryRow = {
  category_id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  value: unknown;
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recurring: RecurringTransactionsService,
  ) {}

  private toYearRange(year: number) {
    return {
      start: new Date(Date.UTC(year, 0, 1)),
      end: new Date(Date.UTC(year + 1, 0, 1)),
    };
  }

  private toNumber(value: unknown) {
    return Number(value ?? 0);
  }

  private buildSummaryFromMonthly(year: number, monthly: ReportMonthlyItem[]): ReportSummary {
    const { income, expense } = monthly.reduce(
      (acc, item) => ({
        income: acc.income + item.income,
        expense: acc.expense + item.expense,
      }),
      { income: 0, expense: 0 },
    );
    const balance = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    return { year, income, expense, balance, savingsRate };
  }

  private buildMonthlySeries(rows: MonthlyTotalsRow[]): ReportMonthlyItem[] {
    const byMonth = new Map<number, { income: number; expense: number }>();
    rows.forEach((row) => {
      byMonth.set(row.month, {
        income: this.toNumber(row.income),
        expense: this.toNumber(row.expense),
      });
    });

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const current = byMonth.get(month) ?? { income: 0, expense: 0 };
      return {
        month,
        income: current.income,
        expense: current.expense,
        balance: current.income - current.expense,
      };
    });
  }

  private buildAvailableYears(
    minDate: Date | null | undefined,
    maxDate: Date | null | undefined,
    currentYear: number,
  ) {
    if (!minDate || !maxDate) {
      return [currentYear];
    }

    const years: number[] = [];
    for (
      let year = maxDate.getUTCFullYear();
      year >= minDate.getUTCFullYear();
      year -= 1
    ) {
      years.push(year);
    }
    if (!years.includes(currentYear)) {
      years.push(currentYear);
    }
    return years.sort((a, b) => b - a);
  }

  private async getMonthlyTotals(userId: string, year: number) {
    const { start, end } = this.toYearRange(year);
    return this.prisma.$queryRaw<MonthlyTotalsRow[]>(
      Prisma.sql`
        SELECT
          EXTRACT(MONTH FROM t.date)::int AS month,
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expense
        FROM public.transactions t
        WHERE t.user_id = ${userId}::uuid
          AND t.date >= ${start}::date
          AND t.date < ${end}::date
        GROUP BY EXTRACT(MONTH FROM t.date)
        ORDER BY month ASC
      `,
    );
  }

  private async getCategorySpending(userId: string, year: number) {
    const { start, end } = this.toYearRange(year);
    const rows = await this.prisma.$queryRaw<CategorySpendingRow[]>(
      Prisma.sql`
        SELECT
          c.name AS name,
          c.type AS type,
          c.color AS color,
          COALESCE(SUM(t.amount), 0) AS value
        FROM public.transactions t
        INNER JOIN public.categories c
          ON c.id = t.category_id
        WHERE t.user_id = ${userId}::uuid
          AND t.type = 'expense'
          AND t.date >= ${start}::date
          AND t.date < ${end}::date
        GROUP BY c.name, c.type, c.color
        ORDER BY value DESC
      `,
    );

    return rows.map((row) => ({
      name: row.name,
      type: row.type,
      color: row.color,
      value: this.toNumber(row.value),
    }));
  }

  private async getCurrentMonthComparison(userId: string): Promise<ReportCurrentMonthComparison> {
    const now = new Date();
    const currentMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const previousMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );
    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const rows = await this.prisma.$queryRaw<MonthComparisonRow[]>(
      Prisma.sql`
        SELECT
          COALESCE(
            SUM(t.amount) FILTER (
              WHERE t.type = 'expense'
                AND t.date >= ${currentMonthStart}::date
                AND t.date < ${nextMonthStart}::date
            ),
            0
          ) AS current_expense,
          COALESCE(
            SUM(t.amount) FILTER (
              WHERE t.type = 'expense'
                AND t.date >= ${previousMonthStart}::date
                AND t.date < ${currentMonthStart}::date
            ),
            0
          ) AS last_expense
        FROM public.transactions t
        WHERE t.user_id = ${userId}::uuid
      `,
    );
    const row = rows[0];
    const currentExpense = this.toNumber(row?.current_expense ?? 0);
    const lastExpense = this.toNumber(row?.last_expense ?? 0);
    const hasVariationBaseline = lastExpense > 0;
    const variation = hasVariationBaseline
      ? ((currentExpense - lastExpense) / lastExpense) * 100
      : null;

    return { currentExpense, lastExpense, variation, hasVariationBaseline };
  }

  private async getCurrentMonthCategories(userId: string) {
    const now = new Date();
    const currentMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const rows = await this.prisma.$queryRaw<CurrentMonthCategoryRow[]>(
      Prisma.sql`
        SELECT
          c.id::text AS category_id,
          c.name AS name,
          t.type AS type,
          c.color AS color,
          COALESCE(SUM(t.amount), 0) AS value
        FROM public.transactions t
        INNER JOIN public.categories c
          ON c.id = t.category_id
        WHERE t.user_id = ${userId}::uuid
          AND t.type = 'expense'
          AND t.date >= ${currentMonthStart}::date
          AND t.date < ${nextMonthStart}::date
        GROUP BY c.id, c.name, t.type, c.color
        ORDER BY value DESC, c.id ASC
      `,
    );

    return rows.map((row) => ({
      categoryId: row.category_id,
      name: row.name,
      type: row.type,
      color: row.color,
      value: this.toNumber(row.value),
    }));
  }

  async getAnalytics(userId: string, year?: number): Promise<ReportsAnalytics> {
    const now = new Date();
    const targetYear = year ?? now.getUTCFullYear();

    // Materialize recurring entries before every aggregate read. Results are not
    // cached in-process because multiple API replicas cannot invalidate each other.
    await this.recurring.ensureRecurringTransactions(userId);

    const [
      monthlyRows,
      categories,
      currentMonthComparison,
      currentMonthCategories,
      minMax,
    ] = await Promise.all([
      this.getMonthlyTotals(userId, targetYear),
      this.getCategorySpending(userId, targetYear),
      this.getCurrentMonthComparison(userId),
      this.getCurrentMonthCategories(userId),
      this.prisma.transaction.aggregate({
        where: { userId },
        _min: { date: true },
        _max: { date: true },
      }),
    ]);

    const monthly = this.buildMonthlySeries(monthlyRows);
    const summary = this.buildSummaryFromMonthly(targetYear, monthly);
    const analytics: ReportsAnalytics = {
      year: targetYear,
      summary,
      monthly,
      categories,
      currentMonthComparison,
      currentMonthCategories,
      availableYears: this.buildAvailableYears(
        minMax._min.date,
        minMax._max.date,
        now.getUTCFullYear(),
      ),
    };

    return analytics;
  }

  private async getYearlyTotals(userId: string, year: number) {
    const { start, end } = this.toYearRange(year);

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
    const targetYear = year ?? now.getUTCFullYear();

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

    return summary;
  }
}
