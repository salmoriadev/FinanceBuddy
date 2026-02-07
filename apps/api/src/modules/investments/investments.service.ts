/**
 * Handles investment CRUD use cases and converts DTOs into explicit create and
 * partial-update payloads to avoid accidental field overwrites.
 */
import { Injectable } from "@nestjs/common";
import { InvestmentsRepository } from "./investments.repository";
import { CreateInvestmentDto } from "./dto/create-investment.dto";
import { UpdateInvestmentDto } from "./dto/update-investment.dto";
import {
  assertResourceDeleted,
  assertResourceFound,
} from "../../common/services/resource-assertions";

type InvestmentCreateData = {
  name: string;
  category?: string | null;
  investedAmount: number;
  currentValue: number;
  startDate?: Date | null;
  notes?: string | null;
};

type InvestmentUpdateData = {
  name?: string;
  category?: string | null;
  investedAmount?: number;
  currentValue?: number;
  startDate?: Date | null;
  notes?: string | null;
};

const toOptionalDate = (value: string | null | undefined) =>
  value ? new Date(value) : null;

const toCreateInvestmentData = (dto: CreateInvestmentDto): InvestmentCreateData => ({
  name: dto.name,
  category: dto.category ?? null,
  investedAmount: dto.investedAmount,
  currentValue: dto.currentValue,
  startDate: toOptionalDate(dto.startDate),
  notes: dto.notes ?? null,
});

const toUpdateInvestmentData = (dto: UpdateInvestmentDto): InvestmentUpdateData => {
  const data: InvestmentUpdateData = {};
  if (dto.name !== undefined) data.name = dto.name;
  if (dto.category !== undefined) data.category = dto.category;
  if (dto.investedAmount !== undefined) data.investedAmount = dto.investedAmount;
  if (dto.currentValue !== undefined) data.currentValue = dto.currentValue;
  if (dto.startDate !== undefined) data.startDate = toOptionalDate(dto.startDate);
  if (dto.notes !== undefined) data.notes = dto.notes;
  return data;
};

@Injectable()
export class InvestmentsService {
  constructor(private readonly repository: InvestmentsRepository) {}

  findAll(userId: string) {
    return this.repository.findAllByUser(userId);
  }

  create(userId: string, dto: CreateInvestmentDto) {
    return this.repository.create(userId, toCreateInvestmentData(dto));
  }

  async update(userId: string, id: string, dto: UpdateInvestmentDto) {
    const updated = await this.repository.update(userId, id, toUpdateInvestmentData(dto));
    return assertResourceFound(updated, "Investment not found");
  }

  async delete(userId: string, id: string) {
    const result = await this.repository.delete(userId, id);
    return assertResourceDeleted(result, "Investment not found");
  }
}
