import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

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

  update(userId: string, id: string, data: {
    description?: string;
    amount?: number;
    type?: "income" | "expense";
    categoryId?: string | null;
    date?: Date;
    isRecurring?: boolean;
  }) {
    return this.prisma.transaction
      .updateMany({
        where: { id, userId },
        data,
      })
      .then(() =>
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
