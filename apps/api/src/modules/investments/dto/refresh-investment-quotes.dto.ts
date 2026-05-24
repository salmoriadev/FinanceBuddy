import { IsArray, IsOptional, IsString } from "class-validator";

export class RefreshInvestmentQuotesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}
