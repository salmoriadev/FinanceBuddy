/**
 * This file implements Create Budget.Dto behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { IsInt, IsNumber, IsUUID, Max, Min } from "class-validator";
import { Transform } from "class-transformer";
import { MAX_MONEY_VALUE } from "../../../common/validators/financial-values";

export class CreateBudgetDto {
  @IsUUID()
  categoryId!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0.01)
  @Max(MAX_MONEY_VALUE)
  amount!: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(2020)
  @Max(2100)
  year!: number;
}
