/**
 * This file implements Create Transaction.Dto behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateTransactionDto {
  @IsString()
  @MinLength(1)
  description!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  amount!: number;

  @IsIn(["income", "expense"])
  type!: "income" | "expense";

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}
