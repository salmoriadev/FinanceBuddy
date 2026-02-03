import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { BudgetsRepository } from "./budgets.repository";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

@Injectable()
export class BudgetsService {
  constructor(private readonly repository: BudgetsRepository) {}

  findAll(userId: string) {
    return this.repository.findAllByUser(userId);
  }

  async create(userId: string, dto: CreateBudgetDto) {
    const category = await this.repository.findCategoryForUser(
      userId,
      dto.categoryId,
    );
    if (!category) {
      throw new ForbiddenException("Category not available for this user");
    }
    return this.repository.create(userId, {
      categoryId: dto.categoryId,
      amount: dto.amount,
      month: dto.month,
      year: dto.year,
    });
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    if (dto.categoryId) {
      const category = await this.repository.findCategoryForUser(
        userId,
        dto.categoryId,
      );
      if (!category) {
        throw new ForbiddenException("Category not available for this user");
      }
    }
    const updated = await this.repository.update(userId, id, {
      categoryId: dto.categoryId,
      amount: dto.amount,
      month: dto.month,
      year: dto.year,
    });
    if (!updated) {
      throw new NotFoundException("Budget not found");
    }
    return updated;
  }

  async delete(userId: string, id: string) {
    const result = await this.repository.delete(userId, id);
    if (result.count === 0) {
      throw new NotFoundException("Budget not found");
    }
    return { deleted: true };
  }
}
