import { PrismaService } from "../src/database/prisma.service";
import { RecurringTransactionsService } from "../src/modules/transactions/recurring.service";
import { TransactionsRepository } from "../src/modules/transactions/transactions.repository";

describe("recurring transaction materialization", () => {
  const originalTimezone = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = "America/Sao_Paulo";
  });

  afterAll(() => {
    if (originalTimezone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTimezone;
    }
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("requests conflict-safe inserts from Prisma", async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      transaction: { createMany },
    } as unknown as PrismaService;
    const repository = new TransactionsRepository(prisma);

    await repository.createRecurringOccurrences(
      "user-1",
      {
        id: "template-1",
        description: "Rent",
        amount: 1_500,
        type: "expense",
        categoryId: null,
      },
      [new Date("2026-02-01T00:00:00.000Z")],
    );

    expect(createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
  });

  it("keeps UTC calendar dates at the day-one boundary across two instances", async () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date("2026-08-01T15:00:00.000Z"));
    const template = {
      id: "template-1",
      userId: "user-1",
      categoryId: null,
      recurrenceParentId: null,
      description: "Rent",
      amount: 1_500,
      type: "expense" as const,
      date: new Date("2026-01-01T00:00:00.000Z"),
      isRecurring: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const inserted = new Set<string>();
    let readers = 0;
    let releaseReaders!: () => void;
    const bothInstancesRead = new Promise<void>((resolve) => {
      releaseReaders = resolve;
    });
    const repository = {
      findRecurringTemplates: jest.fn().mockResolvedValue([template]),
      findLastOccurrenceDate: jest.fn().mockImplementation(async () => {
        readers += 1;
        if (readers === 2) releaseReaders();
        await bothInstancesRead;
        return template.date;
      }),
      createRecurringOccurrences: jest.fn().mockImplementation(
        async (_userId: string, currentTemplate: typeof template, dates: Date[]) => {
          let count = 0;
          for (const date of dates) {
            const identity = `${currentTemplate.id}:${date.toISOString()}`;
            if (inserted.has(identity)) continue;
            inserted.add(identity);
            count += 1;
          }
          return { count };
        },
      ),
    } as unknown as jest.Mocked<TransactionsRepository>;
    const firstInstance = new RecurringTransactionsService(repository);
    const secondInstance = new RecurringTransactionsService(repository);

    const results = await Promise.all([
      firstInstance.ensureRecurringTransactions("user-1"),
      secondInstance.ensureRecurringTransactions("user-1"),
    ]);

    expect(repository.findLastOccurrenceDate).toHaveBeenCalledTimes(2);
    expect(repository.createRecurringOccurrences).toHaveBeenCalledTimes(2);
    expect(results.reduce((total, result) => total + result.generated, 0)).toBe(
      7,
    );
    expect(inserted.size).toBe(7);
    expect([...inserted].sort()).toEqual(
      [
        "2026-02-01T00:00:00.000Z",
        "2026-03-01T00:00:00.000Z",
        "2026-04-01T00:00:00.000Z",
        "2026-05-01T00:00:00.000Z",
        "2026-06-01T00:00:00.000Z",
        "2026-07-01T00:00:00.000Z",
        "2026-08-01T00:00:00.000Z",
      ].map((date) => `${template.id}:${date}`),
    );
  });
});
