/**
 * Handles investment CRUD use cases and converts DTOs into explicit create and
 * partial-update payloads to avoid accidental field overwrites.
 */
import { Injectable } from "@nestjs/common";
import { InvestmentsRepository } from "./investments.repository";
import { CreateInvestmentDto } from "./dto/create-investment.dto";
import { UpdateInvestmentDto } from "./dto/update-investment.dto";
import { InvestmentMarketDataService } from "./investment-market-data.service";
import {
  assertResourceDeleted,
  assertResourceFound,
} from "../../common/services/resource-assertions";

type InvestmentCreateData = {
  name: string;
  category?: string | null;
  assetSymbol?: string | null;
  quantity?: number | null;
  averagePrice?: number | null;
  investedAmount: number;
  currentValue: number;
  startDate?: Date | null;
  notes?: string | null;
};

type InvestmentUpdateData = {
  name?: string;
  category?: string | null;
  assetSymbol?: string | null;
  quantity?: number | null;
  averagePrice?: number | null;
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
  assetSymbol: dto.assetSymbol ?? null,
  quantity: dto.quantity ?? null,
  averagePrice: dto.averagePrice ?? null,
  investedAmount: dto.investedAmount,
  currentValue: dto.currentValue,
  startDate: toOptionalDate(dto.startDate),
  notes: dto.notes ?? null,
});

const toUpdateInvestmentData = (dto: UpdateInvestmentDto): InvestmentUpdateData => {
  const data: InvestmentUpdateData = {};
  if (dto.name !== undefined) data.name = dto.name;
  if (dto.category !== undefined) data.category = dto.category;
  if (dto.assetSymbol !== undefined) data.assetSymbol = dto.assetSymbol;
  if (dto.quantity !== undefined) data.quantity = dto.quantity;
  if (dto.averagePrice !== undefined) data.averagePrice = dto.averagePrice;
  if (dto.investedAmount !== undefined) data.investedAmount = dto.investedAmount;
  if (dto.currentValue !== undefined) data.currentValue = dto.currentValue;
  if (dto.startDate !== undefined) data.startDate = toOptionalDate(dto.startDate);
  if (dto.notes !== undefined) data.notes = dto.notes;
  return data;
};

@Injectable()
export class InvestmentsService {
  constructor(
    private readonly repository: InvestmentsRepository,
    private readonly marketData: InvestmentMarketDataService,
  ) {}

  findAll(userId: string) {
    return this.repository.findAllByUser(userId);
  }

  searchAssets(query: string, type?: string) {
    return this.marketData.searchAssets(query, type);
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

  async refreshMarketData(userId: string, ids?: string[]) {
    const positions = await this.repository.findQuotedPositions(userId, ids);
    const symbols = positions
      .map((position) => position.assetSymbol)
      .filter((symbol): symbol is string => Boolean(symbol));
    const quotes = await this.marketData.getQuotes(symbols);
    const updated = [];

    for (const position of positions) {
      if (!position.assetSymbol || position.quantity === null) continue;
      const quote = quotes.get(position.assetSymbol.toUpperCase());
      if (!quote) continue;

      const quantity = Number(position.quantity);
      const marketValue = Number((quantity * quote.price).toFixed(2));
      const snapshot = await this.repository.updateMarketSnapshot(userId, position.id, {
        currentValue: marketValue,
        marketPrice: quote.price,
        marketValue,
        quoteProvider: quote.provider,
        quoteCurrency: quote.currency,
        quoteUpdatedAt: quote.updatedAt,
      });
      if (snapshot) updated.push(snapshot);
    }

    return {
      updatedCount: updated.length,
      updated,
      missingSymbols: positions
        .map((position) => position.assetSymbol)
        .filter(
          (symbol): symbol is string =>
            Boolean(symbol) && !quotes.has(symbol.toUpperCase()),
        ),
    };
  }
}
