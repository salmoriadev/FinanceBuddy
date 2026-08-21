import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
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
  @IsString()
  @MaxLength(512)
  cursor?: string;
}
