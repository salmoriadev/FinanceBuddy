/**
 * Encapsulates savings-goal use cases and maps API DTOs into persistence-ready
 * inputs while enforcing consistent not-found behavior.
 */
import { Injectable } from "@nestjs/common";
import { GoalsRepository } from "./goals.repository";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";
import {
  assertResourceDeleted,
  assertResourceFound,
} from "../../common/services/resource-assertions";

type GoalCreateData = {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: Date | null;
  color?: string;
};

type GoalUpdateData = {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: Date | null;
  color?: string;
};

const toGoalDate = (value?: string | null) => (value ? new Date(value) : null);

const toCreateGoalData = (dto: CreateGoalDto): GoalCreateData => ({
  name: dto.name,
  targetAmount: dto.targetAmount,
  currentAmount: dto.currentAmount,
  targetDate: toGoalDate(dto.targetDate),
  color: dto.color,
});

const toUpdateGoalData = (dto: UpdateGoalDto): GoalUpdateData => {
  const data: GoalUpdateData = {};
  if (dto.name !== undefined) data.name = dto.name;
  if (dto.targetAmount !== undefined) data.targetAmount = dto.targetAmount;
  if (dto.currentAmount !== undefined) data.currentAmount = dto.currentAmount;
  if (dto.targetDate !== undefined) data.targetDate = toGoalDate(dto.targetDate);
  if (dto.color !== undefined) data.color = dto.color;
  return data;
};

@Injectable()
export class GoalsService {
  constructor(private readonly repository: GoalsRepository) {}

  findAll(userId: string) {
    return this.repository.findAllByUser(userId);
  }

  create(userId: string, dto: CreateGoalDto) {
    return this.repository.create(userId, toCreateGoalData(dto));
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const updated = await this.repository.update(userId, id, toUpdateGoalData(dto));
    return assertResourceFound(updated, "Goal not found");
  }

  async delete(userId: string, id: string) {
    const result = await this.repository.delete(userId, id);
    return assertResourceDeleted(result, "Goal not found");
  }
}
