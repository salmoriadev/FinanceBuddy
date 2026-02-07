/**
 * Encapsulates category database operations with user scoping and case-insensitive
 * lookup helpers used by category business logic.
 */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { runUpdateAndFind } from "../../database/repository-helpers";

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  }

  findByName(userId: string, name: string, type: "income" | "expense") {
    return this.prisma.category.findFirst({
      where: {
        userId,
        type,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });
  }

  create(userId: string, data: {
    name: string;
    color: string;
    icon: string;
    type: "income" | "expense";
  }) {
    return this.prisma.category.create({
      data: {
        userId,
        name: data.name,
        color: data.color,
        icon: data.icon,
        type: data.type,
      },
    });
  }

  update(userId: string, id: string, data: {
    name?: string;
    color?: string;
    icon?: string;
    type?: "income" | "expense";
  }) {
    return runUpdateAndFind(
      () =>
        this.prisma.category.updateMany({
          where: { id, userId },
          data,
        }),
      () => this.prisma.category.findFirst({ where: { id, userId } }),
    );
  }

  delete(userId: string, id: string) {
    return this.prisma.category.deleteMany({ where: { id, userId } });
  }
}
