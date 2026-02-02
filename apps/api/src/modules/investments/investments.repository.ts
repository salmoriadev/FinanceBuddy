import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class InvestmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string) {
    return this.prisma.investment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  create(userId: string, data: {
    name: string;
    category?: string | null;
    investedAmount: number;
    currentValue: number;
    startDate?: Date | null;
    notes?: string | null;
  }) {
    return this.prisma.investment.create({
      data: {
        userId,
        name: data.name,
        category: data.category ?? null,
        investedAmount: data.investedAmount,
        currentValue: data.currentValue,
        startDate: data.startDate ?? null,
        notes: data.notes ?? null,
      },
    });
  }

  update(userId: string, id: string, data: {
    name?: string;
    category?: string | null;
    investedAmount?: number;
    currentValue?: number;
    startDate?: Date | null;
    notes?: string | null;
  }) {
    return this.prisma.investment
      .updateMany({
        where: { id, userId },
        data,
      })
      .then(() =>
        this.prisma.investment.findFirst({ where: { id, userId } }),
      );
  }

  delete(userId: string, id: string) {
    return this.prisma.investment.deleteMany({ where: { id, userId } });
  }
}
