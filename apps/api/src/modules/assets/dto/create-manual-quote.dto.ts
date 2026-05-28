import { Transform } from "class-transformer";
import { IsDateString, IsNumberString, IsOptional, IsString } from "class-validator";

const toStringValue = ({ value }: { value: unknown }) =>
  value === undefined || value === null ? value : String(value);

export class CreateManualQuoteDto {
  @Transform(toStringValue)
  @IsNumberString()
  price!: string;

  @IsOptional()
  @IsString()
  currency?: string | null;

  @IsOptional()
  @IsString()
  source?: string | null;

  @IsOptional()
  @IsDateString()
  quotedAt?: string | null;
}
