import { Injectable, NotFoundException } from "@nestjs/common";
import { GoalsRepository } from "./goals.repository";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";

@Injectable()
export class GoalsService {
  constructor(private readonly repository: GoalsRepository) {}

  findAll(userId: string) {
    return this.repository.findAllByUser(userId);
  }

  create(userId: string, dto: CreateGoalDto) {
    return this.repository.create(userId, {
      name: dto.name,
      targetAmount: dto.targetAmount,
      currentAmount: dto.currentAmount,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
      color: dto.color,
    });
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const data: {
      name?: string;
      targetAmount?: number;
      currentAmount?: number;
      targetDate?: Date | null;
      color?: string;
    } = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.targetAmount !== undefined) data.targetAmount = dto.targetAmount;
    if (dto.currentAmount !== undefined) data.currentAmount = dto.currentAmount;
    if (dto.targetDate !== undefined) {
      data.targetDate = dto.targetDate ? new Date(dto.targetDate) : null;
    }
    if (dto.color !== undefined) data.color = dto.color;

    const updated = await this.repository.update(userId, id, data);
    if (!updated) {
      throw new NotFoundException("Goal not found");
    }
    return updated;
  }

  async delete(userId: string, id: string) {
    const result = await this.repository.delete(userId, id);
    if (result.count === 0) {
      throw new NotFoundException("Goal not found");
    }
    return { deleted: true };
  }
}
