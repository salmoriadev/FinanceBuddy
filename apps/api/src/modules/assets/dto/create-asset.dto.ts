import { Transform } from "class-transformer";
import {
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { IsFinancialDecimal } from "../../../common/validators/financial-values";

export const ASSET_CLASSES = [
  "stock",
  "fii",
  "etf",
  "bdr",
  "fixed_income",
  "crypto",
  "custom",
] as const;

export type AssetClassValue = (typeof ASSET_CLASSES)[number];

export const FIXED_INCOME_INDEXERS = ["fixed", "cdi", "ipca"] as const;
export type FixedIncomeIndexerValue = (typeof FIXED_INCOME_INDEXERS)[number];

const toOptionalStringValue = ({ value }: { value: unknown }) =>
  value === undefined || value === null || value === "" ? undefined : String(value);

export class CreateAssetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(24)
  ticker!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsIn(ASSET_CLASSES)
  class!: AssetClassValue;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sector?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  currency?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @IsOptional()
  @IsIn(FIXED_INCOME_INDEXERS)
  fixedIncomeIndexer?: FixedIncomeIndexerValue | null;

  @Transform(toOptionalStringValue)
  @IsOptional()
  @IsNumberString()
  @IsFinancialDecimal({ allowZero: true, max: 1000 })
  fixedIncomeRate?: string | null;
}
