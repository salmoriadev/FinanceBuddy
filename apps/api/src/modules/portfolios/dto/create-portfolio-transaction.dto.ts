import { Transform } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export const PORTFOLIO_TRANSACTION_TYPES = [
  "buy",
  "sell",
  "dividend",
  "fee",
  "manual_adjustment",
  "opening_balance",
] as const;

export type PortfolioTransactionTypeValue =
  (typeof PORTFOLIO_TRANSACTION_TYPES)[number];

const toOptionalStringValue = ({ value }: { value: unknown }) =>
  value === undefined || value === null || value === "" ? undefined : String(value);

export class CreatePortfolioTransactionDto {
  @IsUUID()
  assetId!: string;

  @IsIn(PORTFOLIO_TRANSACTION_TYPES)
  type!: PortfolioTransactionTypeValue;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  quantity?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  unitPrice?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  totalAmount?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  fees?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  taxes?: string;

  @IsOptional()
  @IsString()
  currency?: string | null;

  @IsDateString()
  occurredAt!: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
