import { Transform } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class TransactionsQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  offset?: number;
}
