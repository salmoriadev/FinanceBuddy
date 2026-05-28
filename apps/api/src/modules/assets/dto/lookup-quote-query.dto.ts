import { IsDateString, IsOptional } from "class-validator";

export class LookupQuoteQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}
