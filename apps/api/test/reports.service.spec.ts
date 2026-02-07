/**
 * Covers report summary aggregation and cache behavior to ensure the reporting
 * service remains correct after query-level performance optimizations.
 */
import { ReportsService } from "../src/modules/reports/reports.service";
import { PrismaService } from "../src/database/prisma.service";
import { RecurringTransactionsService } from "../src/modules/transactions/recurring.service";

describe("ReportsService", () => {
  const groupByMock = jest.fn();
  const ensureRecurringTransactionsMock = jest.fn();

  const prisma = {
    transaction: {
      groupBy: groupByMock,
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
});
