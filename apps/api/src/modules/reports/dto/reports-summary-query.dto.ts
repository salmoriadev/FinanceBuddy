/**
 * Validates report-summary query inputs to avoid malformed values and constrain
 * heavy-year lookups to a sensible range.
 */
import { Transform } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class ReportsSummaryQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}
