/**
 * Coordinates transaction workflows, including recurring generation, category
 * authorization checks, and DTO-to-persistence mapping for create/update flows.
 */
import { Injectable } from "@nestjs/common";
import { TransactionsRepository } from "./transactions.repository";
import { RecurringTransactionsService } from "./recurring.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsQueryDto } from "./dto/transactions-query.dto";
import {
  assertCategoryAccess,
  assertResourceDeleted,
  assertResourceFound,
} from "../../common/services/resource-assertions";
import { DEFAULT_TRANSACTIONS_LIMIT } from "./transactions.constants";

type TransactionCreateData = {
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryId?: string | null;
  date: Date;
  isRecurring?: boolean;
};

type TransactionUpdateData = {
  description?: string;
  amount?: number;
  type?: "income" | "expense";
  categoryId?: string | null;
  date?: Date;
  isRecurring?: boolean;
};

const toCreateTransactionData = (dto: CreateTransactionDto): TransactionCreateData => ({
  description: dto.description,
  amount: dto.amount,
  type: dto.type,
  categoryId: dto.categoryId ?? null,
  date: new Date(dto.date),
  isRecurring: dto.isRecurring ?? false,
});

const toUpdateTransactionData = (dto: UpdateTransactionDto): TransactionUpdateData => {
  const data: TransactionUpdateData = {};
  if (dto.description !== undefined) data.description = dto.description;
  if (dto.amount !== undefined) data.amount = dto.amount;
  if (dto.type !== undefined) data.type = dto.type;
  if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
  if (dto.date !== undefined) data.date = new Date(dto.date);
  if (dto.isRecurring !== undefined) data.isRecurring = dto.isRecurring;
  return data;
};

@Injectable()
export class TransactionsService {
  constructor(
    private readonly repository: TransactionsRepository,
    private readonly recurring: RecurringTransactionsService,
  ) {}

  async findAll(userId: string, query?: TransactionsQueryDto) {
    await this.recurring.ensureRecurringTransactions(userId);
    return this.repository.findAllByUser(userId, {
      limit: query?.limit ?? DEFAULT_TRANSACTIONS_LIMIT,
      offset: query?.offset ?? 0,
    });
  }

  async create(userId: string, dto: CreateTransactionDto) {
    if (dto.categoryId) {
      await assertCategoryAccess(this.repository, userId, dto.categoryId);
    }
    return this.repository.create(userId, toCreateTransactionData(dto));
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    if (dto.categoryId !== undefined && dto.categoryId !== null) {
      await assertCategoryAccess(this.repository, userId, dto.categoryId);
    }
    const updated = await this.repository.update(userId, id, toUpdateTransactionData(dto));
    return assertResourceFound(updated, "Transaction not found");
  }

  async delete(userId: string, id: string) {
    const result = await this.repository.delete(userId, id);
    return assertResourceDeleted(result, "Transaction not found");
  }
}
