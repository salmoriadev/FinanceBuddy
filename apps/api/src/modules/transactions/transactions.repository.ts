/**
 * Implements transaction persistence primitives, including pagination, category
 * joins, and recurring-template support operations.
 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { runUpdateAndFind } from "../../database/repository-helpers";
import { DEFAULT_TRANSACTIONS_LIMIT } from "./transactions.constants";
import { TransactionCursor } from "./transactions-pagination";

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPageByUser(
    userId: string,
    opts?: { limit?: number; cursor?: TransactionCursor },
  ) {
    const cursorFilter: Prisma.TransactionWhereInput = opts?.cursor
      ? {
          OR: [
            { date: { lt: opts.cursor.date } },
            {
              date: opts.cursor.date,
              createdAt: { lt: opts.cursor.createdAt },
            },
            {
              date: opts.cursor.date,
              createdAt: opts.cursor.createdAt,
              id: { lt: opts.cursor.id },
            },
          ],
        }
      : {};
    const limit = opts?.limit ?? DEFAULT_TRANSACTIONS_LIMIT;

    return this.prisma.transaction.findMany({
      where: { userId, ...cursorFilter },
      include: { category: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
  }

  findCategoryForUser(userId: string, categoryId: string) {
    return this.prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true },
    });
  }

  create(userId: string, data: {
    description: string;
    amount: number;
    type: "income" | "expense";
    categoryId?: string | null;
    date: Date;
    isRecurring?: boolean;
  }) {
    return this.prisma.transaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId ?? null,
        date: data.date,
        isRecurring: data.isRecurring ?? false,
        userId,
      },
      include: { category: true },
    });
  }

  findRecurringTemplates(userId: string) {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        isRecurring: true,
        recurrenceParentId: null,
      },
    });
  }

  findLastOccurrenceDate(userId: string, templateId: string) {
    return this.prisma.transaction
      .findFirst({
        where: {
          userId,
          OR: [{ id: templateId }, { recurrenceParentId: templateId }],
        },
        orderBy: { date: "desc" },
        select: { date: true },
      })
      .then((result) => result?.date ?? null);
  }

  createRecurringOccurrences(
    userId: string,
    template: {
      id: string;
      description: string;
      amount: unknown;
      type: "income" | "expense";
      categoryId: string | null;
    },
    dates: Date[],
  ) {
    if (dates.length === 0) return Promise.resolve({ count: 0 });
    return this.prisma.transaction.createMany({
      data: dates.map((date) => ({
        userId,
        description: template.description,
        amount: Number(template.amount),
        type: template.type,
        categoryId: template.categoryId,
        date,
        isRecurring: false,
        recurrenceParentId: template.id,
      })),
      skipDuplicates: true,
    });
  }

  update(userId: string, id: string, data: {
    description?: string;
    amount?: number;
    type?: "income" | "expense";
    categoryId?: string | null;
    date?: Date;
    isRecurring?: boolean;
  }) {
    return runUpdateAndFind(
      () =>
        this.prisma.transaction.updateMany({
          where: { id, userId },
          data,
        }),
      () =>
        this.prisma.transaction.findFirst({
          where: { id, userId },
          include: { category: true },
        }),
    );
  }

  delete(userId: string, id: string) {
    return this.prisma.transaction.deleteMany({
      where: { id, userId },
    });
  }
}
