import { Transform } from "class-transformer";
import { IsDateString, IsNumberString, IsOptional, IsString } from "class-validator";

const toOptionalStringValue = ({ value }: { value: unknown }) =>
  value === undefined || value === null || value === "" ? undefined : String(value);

export class ReceiveDividendReceiptDto {
  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  quantity?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  amountPerShare?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  taxes?: string;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  totalAmount?: string;

  @IsOptional()
  @IsDateString()
  receivedAt?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
