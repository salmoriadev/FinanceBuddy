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
import { MAX_MONEY_VALUE } from "../../../common/validators/financial-values";

export class CreateGoalDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0.01)
  @Max(MAX_MONEY_VALUE)
  targetAmount!: number;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined || value === "" ? value : Number(value)))
  @IsNumber()
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  currentAmount?: number;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string;
}
