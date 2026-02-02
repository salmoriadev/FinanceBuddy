import { Injectable, NotFoundException } from "@nestjs/common";
import { InvestmentsRepository } from "./investments.repository";
import { CreateInvestmentDto } from "./dto/create-investment.dto";
import { UpdateInvestmentDto } from "./dto/update-investment.dto";

@Injectable()
export class InvestmentsService {
  constructor(private readonly repository: InvestmentsRepository) {}

  findAll(userId: string) {
    return this.repository.findAllByUser(userId);
  }

  create(userId: string, dto: CreateInvestmentDto) {
    return this.repository.create(userId, {
      name: dto.name,
      category: dto.category ?? null,
      investedAmount: dto.investedAmount,
      currentValue: dto.currentValue,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      notes: dto.notes ?? null,
    });
  }

  async update(userId: string, id: string, dto: UpdateInvestmentDto) {
    const updated = await this.repository.update(userId, id, {
      name: dto.name,
      category: dto.category ?? null,
      investedAmount: dto.investedAmount,
      currentValue: dto.currentValue,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      notes: dto.notes ?? null,
    });
    if (!updated) {
      throw new NotFoundException("Investimento não encontrado");
    }
    return updated;
  }

  async delete(userId: string, id: string) {
    const result = await this.repository.delete(userId, id);
    if (result.count === 0) {
      throw new NotFoundException("Investimento não encontrado");
    }
    return { deleted: true };
  }
}
