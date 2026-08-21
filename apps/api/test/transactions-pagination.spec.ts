import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { PrismaService } from "../src/database/prisma.service";
import { RecurringTransactionsService } from "../src/modules/transactions/recurring.service";
import { TransactionsQueryDto } from "../src/modules/transactions/dto/transactions-query.dto";
import { DEFAULT_TRANSACTIONS_LIMIT } from "../src/modules/transactions/transactions.constants";
import { TransactionsRepository } from "../src/modules/transactions/transactions.repository";
import { TransactionsService } from "../src/modules/transactions/transactions.service";

describe("transaction pagination defaults", () => {
  it("assigns a bounded limit when the query omits pagination", async () => {
    const query = plainToInstance(TransactionsQueryDto, {});

    await expect(validate(query)).resolves.toHaveLength(0);
    expect(query).toEqual(
      expect.objectContaining({
        limit: DEFAULT_TRANSACTIONS_LIMIT,
        offset: 0,
      }),
    );
  });

  it("caps service reads even when no query DTO is provided", async () => {
    const repository = {
      findAllByUser: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<TransactionsRepository>;
    const recurring = {
      ensureRecurringTransactions: jest.fn().mockResolvedValue({ generated: 0 }),
    } as unknown as jest.Mocked<RecurringTransactionsService>;
    const service = new TransactionsService(repository, recurring);

    await service.findAll("user-1");

    expect(repository.findAllByUser).toHaveBeenCalledWith("user-1", {
      limit: DEFAULT_TRANSACTIONS_LIMIT,
      offset: 0,
    });
  });

  it("keeps direct repository reads bounded", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      transaction: { findMany },
    } as unknown as PrismaService;
    const repository = new TransactionsRepository(prisma);

    await repository.findAllByUser("user-1");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: DEFAULT_TRANSACTIONS_LIMIT,
        skip: 0,
      }),
    );
  });
});
