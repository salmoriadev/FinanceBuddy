import { IsInt, IsNumber, IsUUID, Max, Min } from "class-validator";
import { Transform } from "class-transformer";

export class CreateBudgetDto {
  @IsUUID()
  categoryId!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
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
