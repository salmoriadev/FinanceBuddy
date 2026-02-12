/**
 * Covers report summary aggregation and cache behavior to ensure the reporting
 * service remains correct after query-level performance optimizations.
 */
import { ReportsService } from "../src/modules/reports/reports.service";
import { PrismaService } from "../src/database/prisma.service";
import { RecurringTransactionsService } from "../src/modules/transactions/recurring.service";

describe("ReportsService", () => {
  const groupByMock = jest.fn();
  const aggregateMock = jest.fn();
  const queryRawMock = jest.fn();
  const ensureRecurringTransactionsMock = jest.fn();

  const prisma = {
    $queryRaw: queryRawMock,
    transaction: {
      groupBy: groupByMock,
      aggregate: aggregateMock,
    },
  } as unknown as PrismaService;

  const recurring = {
    ensureRecurringTransactions: ensureRecurringTransactionsMock,
  } as unknown as RecurringTransactionsService;

  let service: ReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportsService(prisma, recurring);
  });

  it("computes summary totals from grouped aggregates", async () => {
    ensureRecurringTransactionsMock.mockResolvedValue({ generated: 0 } as never);
    groupByMock.mockResolvedValue([
      { type: "income", _sum: { amount: 4000 } },
      { type: "expense", _sum: { amount: 1500 } },
    ] as never);

    const summary = await service.getSummary("user-1", 2026);

    expect(ensureRecurringTransactionsMock).toHaveBeenCalledWith("user-1");
    expect(groupByMock).toHaveBeenCalledWith({
      by: ["type"],
      where: {
        userId: "user-1",
        date: {
          gte: new Date(2026, 0, 1),
          lt: new Date(2027, 0, 1),
        },
      },
      _sum: {
        amount: true,
      },
    });
    expect(summary).toEqual({
      year: 2026,
      income: 4000,
      expense: 1500,
      balance: 2500,
      savingsRate: 62.5,
    });
  });

  it("returns cached summary on repeated calls", async () => {
    ensureRecurringTransactionsMock.mockResolvedValue({ generated: 0 } as never);
    groupByMock.mockResolvedValue([
      { type: "income", _sum: { amount: 2000 } },
    ] as never);

    const first = await service.getSummary("user-2", 2026);
    const second = await service.getSummary("user-2", 2026);

    expect(first).toEqual(second);
    expect(ensureRecurringTransactionsMock).toHaveBeenCalledTimes(1);
    expect(groupByMock).toHaveBeenCalledTimes(1);
  });

  it("builds analytics payload from aggregated queries", async () => {
    ensureRecurringTransactionsMock.mockResolvedValue({ generated: 0 } as never);
    queryRawMock
      .mockResolvedValueOnce([
        { month: 1, income: 2000, expense: 500 },
        { month: 2, income: 1000, expense: 250 },
      ] as never)
      .mockResolvedValueOnce([
        {
          name: "Food",
          type: "expense",
          color: "#f97316",
          value: 750,
        },
      ] as never)
      .mockResolvedValueOnce([
        { current_expense: 400, last_expense: 200 },
      ] as never);
    aggregateMock.mockResolvedValue({
      _min: { date: new Date(2024, 0, 10) },
      _max: { date: new Date(2026, 4, 5) },
    } as never);

    const analytics = await service.getAnalytics("user-1", 2026);

    expect(ensureRecurringTransactionsMock).toHaveBeenCalledWith("user-1");
    expect(queryRawMock).toHaveBeenCalledTimes(3);
    expect(aggregateMock).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      _min: { date: true },
      _max: { date: true },
    });
    expect(analytics.year).toBe(2026);
    expect(analytics.summary).toEqual({
      year: 2026,
      income: 3000,
      expense: 750,
      balance: 2250,
      savingsRate: 75,
    });
    expect(analytics.monthly[0]).toEqual({
      month: 1,
      income: 2000,
      expense: 500,
      balance: 1500,
    });
    expect(analytics.monthly[1]).toEqual({
      month: 2,
      income: 1000,
      expense: 250,
      balance: 750,
    });
    expect(analytics.categories).toEqual([
      {
        name: "Food",
        type: "expense",
        color: "#f97316",
        value: 750,
      },
    ]);
    expect(analytics.currentMonthComparison).toEqual({
      currentExpense: 400,
      lastExpense: 200,
      variation: 100,
      hasVariationBaseline: true,
    });
    expect(analytics.availableYears).toEqual([2026, 2025, 2024]);
  });

  it("returns cached analytics on repeated calls", async () => {
    ensureRecurringTransactionsMock.mockResolvedValue({ generated: 0 } as never);
    queryRawMock
      .mockResolvedValueOnce([
        { month: 3, income: 1200, expense: 300 },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        { current_expense: 300, last_expense: 0 },
      ] as never);
    aggregateMock.mockResolvedValue({
      _min: { date: new Date(2026, 2, 1) },
      _max: { date: new Date(2026, 2, 1) },
    } as never);

    const first = await service.getAnalytics("user-2", 2026);
    const second = await service.getAnalytics("user-2", 2026);

    expect(first).toEqual(second);
    expect(ensureRecurringTransactionsMock).toHaveBeenCalledTimes(1);
    expect(queryRawMock).toHaveBeenCalledTimes(3);
    expect(aggregateMock).toHaveBeenCalledTimes(1);
  });
});
