import { IsDateString, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import { Transform } from "class-transformer";

export class CreateInvestmentDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  category?: string | null;

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
