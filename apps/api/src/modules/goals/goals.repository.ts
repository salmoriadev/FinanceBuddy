import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class GoalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string) {
    return this.prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  create(userId: string, data: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate?: Date | null;
    color?: string;
  }) {
    return this.prisma.savingsGoal.create({
      data: {
        userId,
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount ?? 0,
        targetDate: data.targetDate ?? null,
        color: data.color ?? "#10b981",
      },
    });
  }

  update(userId: string, id: string, data: {
    name?: string;
    targetAmount?: number;
    currentAmount?: number;
    targetDate?: Date | null;
    color?: string;
  }) {
    return this.prisma.savingsGoal
      .updateMany({
        where: { id, userId },
        data,
      })
      .then(() => this.prisma.savingsGoal.findFirst({ where: { id, userId } }));
  }

  delete(userId: string, id: string) {
    return this.prisma.savingsGoal.deleteMany({ where: { id, userId } });
  }
}
