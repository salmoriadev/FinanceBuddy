import { Transform } from "class-transformer";
import { IsDateString, IsNumberString, IsOptional, IsString, MaxLength } from "class-validator";
import {
  IsFinancialDecimal,
  MAX_MONEY_VALUE,
  MAX_QUANTITY_VALUE,
} from "../../../common/validators/financial-values";

const toOptionalStringValue = ({ value }: { value: unknown }) =>
  value === undefined || value === null || value === "" ? undefined : String(value);

export class ReceiveDividendReceiptDto {
  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  @IsFinancialDecimal({ max: MAX_QUANTITY_VALUE })
  quantity?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  @IsFinancialDecimal()
  amountPerShare?: string;

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
  @IsDateString()
  receivedAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
