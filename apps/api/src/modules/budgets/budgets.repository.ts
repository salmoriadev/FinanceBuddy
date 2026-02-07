/**
 * Persists and fetches budget records scoped by user, including category joins
 * needed by the budgets API responses.
 */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { runUpdateAndFind } from "../../database/repository-helpers";

@Injectable()
export class BudgetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string) {
    return this.prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
  }

  findCategoryForUser(userId: string, categoryId: string) {
    return this.prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true },
    });
  }

  create(userId: string, data: {
    categoryId: string;
    amount: number;
    month: number;
    year: number;
  }) {
    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: data.categoryId,
        amount: data.amount,
        month: data.month,
        year: data.year,
      },
      include: { category: true },
    });
  }

  update(userId: string, id: string, data: {
    categoryId?: string;
    amount?: number;
    month?: number;
    year?: number;
  }) {
    return runUpdateAndFind(
      () =>
        this.prisma.budget.updateMany({
          where: { id, userId },
          data,
        }),
      () =>
        this.prisma.budget.findFirst({
          where: { id, userId },
          include: { category: true },
        }),
    );
  }

  delete(userId: string, id: string) {
    return this.prisma.budget.deleteMany({
      where: { id, userId },
    });
  }
}
