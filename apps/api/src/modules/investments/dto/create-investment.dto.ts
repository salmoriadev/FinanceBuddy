import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";
import { MAX_QUANTITY_VALUE } from "../../../common/validators/financial-values";

export const MAX_LEGACY_INVESTMENT_MONEY_VALUE = 9_999_999_999.99;

export class CreateInvestmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  assetSymbol?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === "" ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  @Max(MAX_QUANTITY_VALUE)
  quantity?: number | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === "" ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  @Max(MAX_LEGACY_INVESTMENT_MONEY_VALUE)
  averagePrice?: number | null;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @Max(MAX_LEGACY_INVESTMENT_MONEY_VALUE)
  investedAmount!: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @Max(MAX_LEGACY_INVESTMENT_MONEY_VALUE)
  currentValue!: number;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
