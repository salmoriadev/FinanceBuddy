import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";
import { MAX_MONEY_VALUE } from "../../../common/validators/financial-values";

export class CreateTransactionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  description!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0.01)
  @Max(MAX_MONEY_VALUE)
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
