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

export const DIVIDEND_EVENT_STATUSES = [
  "announced",
  "confirmed",
  "received",
  "cancelled",
] as const;

export type DividendEventStatusValue =
  (typeof DIVIDEND_EVENT_STATUSES)[number];

const toOptionalStringValue = ({ value }: { value: unknown }) =>
  value === undefined || value === null || value === "" ? undefined : String(value);

export class CreateDividendReceiptDto {
  @IsUUID()
  assetId!: string;

  @IsOptional()
  @IsIn(DIVIDEND_EVENT_STATUSES)
  status?: DividendEventStatusValue;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  @IsFinancialDecimal({ max: MAX_QUANTITY_VALUE })
  quantity?: string;

  @Transform(toOptionalStringValue)
  @IsNumberString()
  @IsFinancialDecimal()
  amountPerShare!: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  @IsFinancialDecimal({ allowZero: true })
  taxes?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  @IsFinancialDecimal({ max: MAX_MONEY_VALUE })
  totalAmount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  currency?: string | null;

  @IsOptional()
  @IsDateString()
  exDate?: string | null;

  @IsDateString()
  paymentDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
