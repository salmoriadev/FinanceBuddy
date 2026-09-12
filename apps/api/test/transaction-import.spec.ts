import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { PrismaService } from "../src/database/prisma.service";
import { ImportTransactionsDto } from "../src/modules/transactions/dto/import-transactions.dto";
import { TransactionsRepository } from "../src/modules/transactions/transactions.repository";
import { TransactionsService } from "../src/modules/transactions/transactions.service";
import { RecurringTransactionsService } from "../src/modules/transactions/recurring.service";

describe("transaction CSV import", () => {
  it("validates every imported transaction and limits batch size", async () => {
    const dto = plainToInstance(ImportTransactionsDto, {
      transactions: [
        {
          description: "Valid",
          amount: -1,
          type: "expense",
          date: "2026-09-01",
        },
      ],
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === "transactions")).toBe(true);
  });

  it("rejects impossible dates and timestamps in CSV batches", async () => {
    const dto = plainToInstance(ImportTransactionsDto, {
      transactions: [
        {
          description: "Impossible date",
          amount: 10,
          type: "expense",
          date: "2026-02-30T10:00:00Z",
        },
      ],
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === "transactions")).toBe(true);
  });

  it("skips the matching number of existing entries without collapsing valid repeats", async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        description: "Coffee Shop",
        amount: 12.5,
        type: "expense",
        date: new Date("2026-09-01"),
      },
      {
        description: "Coffee Shop",
        amount: 12.5,
        type: "expense",
        date: new Date("2026-09-01"),
      },
    ]);
    const createMany = jest.fn().mockResolvedValue({ count: 1 });
    const transactionClient = { transaction: { findMany, createMany } };
    const prisma = {
      $transaction: jest.fn((operation) => operation(transactionClient)),
    } as unknown as PrismaService;
    const repository = new TransactionsRepository(prisma);
    const repeated = {
      description: "Coffee Shop",
      amount: 12.5,
      type: "expense" as const,
      categoryId: null,
      date: new Date("2026-09-01"),
    };

    const result = await repository.importMany("user-1", [
      repeated,
      repeated,
      repeated,
    ]);

    expect(result).toEqual({ created: 1, skipped: 2 });
    expect(createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ description: "Coffee Shop", amount: 12.5 })],
    });
  });

  it("authorizes each selected category once before importing", async () => {
    const repository = {
      findCategoryForUser: jest.fn().mockResolvedValue({ id: "category-1" }),
      importMany: jest.fn().mockResolvedValue({ created: 2, skipped: 0 }),
    } as unknown as jest.Mocked<TransactionsRepository>;
    const recurring = {} as jest.Mocked<RecurringTransactionsService>;
    const service = new TransactionsService(repository, recurring);

    await service.import("user-1", {
      transactions: [
        {
          description: "One",
          amount: 10,
          type: "expense",
          categoryId: "category-1",
          date: "2026-09-01",
        },
        {
          description: "Two",
          amount: 20,
          type: "expense",
          categoryId: "category-1",
          date: "2026-09-02",
        },
      ],
    });

    expect(repository.findCategoryForUser).toHaveBeenCalledTimes(1);
    expect(repository.findCategoryForUser).toHaveBeenCalledWith(
      "user-1",
      "category-1",
    );
    expect(repository.importMany).toHaveBeenCalledWith(
      "user-1",
      expect.arrayContaining([
        expect.objectContaining({ description: "One", categoryId: "category-1" }),
        expect.objectContaining({ description: "Two", categoryId: "category-1" }),
      ]),
    );
  });
});
