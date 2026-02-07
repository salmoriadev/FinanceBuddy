/**
 * Implements budget business rules, including category ownership validation and
 * consistent CRUD error semantics for the budgets module.
 */
import { Injectable } from "@nestjs/common";
import { BudgetsRepository } from "./budgets.repository";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import {
  assertCategoryAccess,
  assertResourceDeleted,
  assertResourceFound,
} from "../../common/services/resource-assertions";

const toCreateBudgetData = (dto: CreateBudgetDto) => ({
  categoryId: dto.categoryId,
  amount: dto.amount,
  month: dto.month,
  year: dto.year,
});

const toUpdateBudgetData = (dto: UpdateBudgetDto) => ({
  categoryId: dto.categoryId,
  amount: dto.amount,
  month: dto.month,
  year: dto.year,
});

@Injectable()
export class BudgetsService {
  constructor(private readonly repository: BudgetsRepository) {}

  findAll(userId: string) {
    return this.repository.findAllByUser(userId);
  }

  async create(userId: string, dto: CreateBudgetDto) {
    await assertCategoryAccess(this.repository, userId, dto.categoryId);
    return this.repository.create(userId, toCreateBudgetData(dto));
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    if (dto.categoryId) {
      await assertCategoryAccess(this.repository, userId, dto.categoryId);
    }
    const updated = await this.repository.update(userId, id, toUpdateBudgetData(dto));
    return assertResourceFound(updated, "Budget not found");
  }

  async delete(userId: string, id: string) {
    const result = await this.repository.delete(userId, id);
    return assertResourceDeleted(result, "Budget not found");
  }
}
