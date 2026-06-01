import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateInvestmentDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  category?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  assetSymbol?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === "" ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  quantity?: number | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === "" ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  averagePrice?: number | null;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  investedAmount!: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  currentValue!: number;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
