/**
 * Implements transaction persistence primitives, including pagination, category
 * joins, and recurring-template support operations.
 */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { runUpdateAndFind } from "../../database/repository-helpers";

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string, opts?: { limit?: number; offset?: number }) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
      take: opts?.limit,
      skip: opts?.offset,
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
