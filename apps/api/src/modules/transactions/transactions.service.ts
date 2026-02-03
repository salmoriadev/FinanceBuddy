import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { TransactionsRepository } from "./transactions.repository";
import { RecurringTransactionsService } from "./recurring.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsQueryDto } from "./dto/transactions-query.dto";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly repository: TransactionsRepository,
    private readonly recurring: RecurringTransactionsService,
  ) {}

  async findAll(userId: string, query?: TransactionsQueryDto) {
    await this.recurring.ensureRecurringTransactions(userId);
    return this.repository.findAllByUser(userId, {
      limit: query?.limit,
      offset: query?.offset,
    });
  }

  async create(userId: string, dto: CreateTransactionDto) {
    if (dto.categoryId) {
      const category = await this.repository.findCategoryForUser(
        userId,
        dto.categoryId,
      );
      if (!category) {
        throw new ForbiddenException("Category not available for this user");
      }
    }
    return this.repository.create(userId, {
      description: dto.description,
      amount: dto.amount,
      type: dto.type,
      categoryId: dto.categoryId ?? null,
      date: new Date(dto.date),
      isRecurring: dto.isRecurring ?? false,
    });
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    if (dto.categoryId !== undefined && dto.categoryId !== null) {
      const category = await this.repository.findCategoryForUser(
        userId,
        dto.categoryId,
      );
      if (!category) {
        throw new ForbiddenException("Category not available for this user");
      }
    }
    const updated = await this.repository.update(userId, id, {
      description: dto.description,
      amount: dto.amount,
      type: dto.type,
      ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
      date: dto.date ? new Date(dto.date) : undefined,
      isRecurring: dto.isRecurring,
    });
    if (!updated) {
      throw new NotFoundException("Transaction not found");
    }
    return updated;
  }

  async delete(userId: string, id: string) {
    const result = await this.repository.delete(userId, id);
    if (result.count === 0) {
      throw new NotFoundException("Transaction not found");
    }
    return { deleted: true };
  }
}
