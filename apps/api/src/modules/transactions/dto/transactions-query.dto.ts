import { Transform } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import {
  DEFAULT_TRANSACTIONS_LIMIT,
  MAX_TRANSACTIONS_LIMIT,
} from "../transactions.constants";

export class TransactionsQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(MAX_TRANSACTIONS_LIMIT)
  limit: number = DEFAULT_TRANSACTIONS_LIMIT;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  offset: number = 0;
}
