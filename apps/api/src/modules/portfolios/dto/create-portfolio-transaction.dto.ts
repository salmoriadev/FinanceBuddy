import { Transform } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import {
  IsFinancialDecimal,
  MAX_MONEY_VALUE,
  MAX_QUANTITY_VALUE,
} from "../../../common/validators/financial-values";

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
  @IsFinancialDecimal({ max: MAX_QUANTITY_VALUE })
  quantity?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  @IsFinancialDecimal()
  unitPrice?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  @IsFinancialDecimal({ max: MAX_MONEY_VALUE })
  totalAmount?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  @IsFinancialDecimal({ allowZero: true })
  fees?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  @IsFinancialDecimal({ allowZero: true })
  taxes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  currency?: string | null;

  @IsDateString()
  occurredAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
