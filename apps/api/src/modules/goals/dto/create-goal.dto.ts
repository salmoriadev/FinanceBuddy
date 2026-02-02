import { IsDateString, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import { Transform } from "class-transformer";

export class CreateGoalDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  targetAmount!: number;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined || value === "" ? value : Number(value)))
  @IsNumber()
  currentAmount?: number;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsString()
  color?: string;
}
