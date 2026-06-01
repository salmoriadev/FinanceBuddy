import { Transform } from "class-transformer";
import { IsDateString, IsNumberString, IsOptional, IsString, MaxLength } from "class-validator";
import { IsFinancialDecimal } from "../../../common/validators/financial-values";

const toStringValue = ({ value }: { value: unknown }) =>
  value === undefined || value === null ? value : String(value);

export class CreateManualQuoteDto {
  @Transform(toStringValue)
  @IsNumberString()
  @IsFinancialDecimal()
  price!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  currency?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string | null;

  @IsOptional()
  @IsDateString()
  quotedAt?: string | null;
}
