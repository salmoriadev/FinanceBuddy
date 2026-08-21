import { BadRequestException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { PrismaService } from "../src/database/prisma.service";
import { RecurringTransactionsService } from "../src/modules/transactions/recurring.service";
import { TransactionsQueryDto } from "../src/modules/transactions/dto/transactions-query.dto";
import { DEFAULT_TRANSACTIONS_LIMIT } from "../src/modules/transactions/transactions.constants";
import {
  decodeTransactionCursor,
  encodeTransactionCursor,
} from "../src/modules/transactions/transactions-pagination";
import { TransactionsRepository } from "../src/modules/transactions/transactions.repository";
import { TransactionsService } from "../src/modules/transactions/transactions.service";

const transactionId = (index: number) =>
  `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;

const transaction = (index: number) => ({
  id: transactionId(index),
  userId: "user-1",
  categoryId: null,
  recurrenceParentId: null,
  description: `Transaction ${index}`,
  amount: 10,
  type: "expense" as const,
  date: new Date("2026-08-21T00:00:00.000Z"),
  isRecurring: false,
  createdAt: new Date("2026-08-21T12:00:00.000Z"),
  category: null,
});

describe("transaction cursor pagination", () => {
  it("assigns a bounded limit when pagination is omitted", async () => {
    const query = plainToInstance(TransactionsQueryDto, {});

    await expect(validate(query)).resolves.toHaveLength(0);
    expect(query).toEqual(
      expect.objectContaining({ limit: DEFAULT_TRANSACTIONS_LIMIT }),
    );
  });

  it("returns a stable cursor when more than 100 rows share a date", async () => {
    const firstDatabasePage = Array.from({ length: 101 }, (_, offset) =>
      transaction(150 - offset),
    );
    const repository = {
      findPageByUser: jest.fn().mockResolvedValue(firstDatabasePage),
    } as unknown as jest.Mocked<TransactionsRepository>;
    const recurring = {
      ensureRecurringTransactions: jest.fn().mockResolvedValue({ generated: 0 }),
    } as unknown as jest.Mocked<RecurringTransactionsService>;
    const service = new TransactionsService(repository, recurring);

    const page = await service.findAll("user-1");

    expect(page.items).toHaveLength(100);
    expect(page.items[0].id).toBe(transactionId(150));
    expect(page.items[99].id).toBe(transactionId(51));
    expect(page.pageInfo.hasMore).toBe(true);
    expect(decodeTransactionCursor(page.pageInfo.nextCursor!)).toEqual({
      date: page.items[99].date,
      createdAt: page.items[99].createdAt,
      id: transactionId(51),
    });
  });

  it("uses deterministic keyset predicates and requests one lookahead row", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      transaction: { findMany },
    } as unknown as PrismaService;
    const repository = new TransactionsRepository(prisma);
    const cursor = {
      date: new Date("2026-08-21T00:00:00.000Z"),
      createdAt: new Date("2026-08-21T12:00:00.000Z"),
      id: transactionId(51),
    };

    await repository.findPageByUser("user-1", { limit: 100, cursor });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        OR: [
          { date: { lt: cursor.date } },
          { date: cursor.date, createdAt: { lt: cursor.createdAt } },
          {
            date: cursor.date,
            createdAt: cursor.createdAt,
            id: { lt: cursor.id },
          },
        ],
      },
      include: { category: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: 101,
    });
  });

  it("rejects a malformed or forged cursor", () => {
    expect(() => decodeTransactionCursor("not-a-valid-cursor")).toThrow(
      BadRequestException,
    );
    const invalidIdCursor = Buffer.from(
      JSON.stringify({
        version: 1,
        date: "2026-08-21T00:00:00.000Z",
        createdAt: "2026-08-21T12:00:00.000Z",
        id: "not-a-uuid",
      }),
    ).toString("base64url");
    expect(() => decodeTransactionCursor(invalidIdCursor)).toThrow(
      BadRequestException,
    );
  });

  it("round-trips a valid opaque cursor", () => {
    const cursor = {
      date: new Date("2026-08-21T00:00:00.000Z"),
      createdAt: new Date("2026-08-21T12:00:00.000Z"),
      id: transactionId(51),
    };

    expect(decodeTransactionCursor(encodeTransactionCursor(cursor))).toEqual(
      cursor,
    );
  });
});
