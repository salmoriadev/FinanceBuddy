import { Transform } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

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
  quantity?: string;

  @Transform(toOptionalStringValue)
  @IsNumberString()
  amountPerShare!: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  taxes?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  totalAmount?: string;

  @IsOptional()
  @IsString()
  currency?: string | null;

  @IsOptional()
  @IsDateString()
  exDate?: string | null;

  @IsDateString()
  paymentDate!: string;

  @IsOptional()
  @IsString()
  source?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
