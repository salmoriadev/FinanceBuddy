import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

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
}
