import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

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
  ticker!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsIn(ASSET_CLASSES)
  class!: AssetClassValue;

  @IsOptional()
  @IsString()
  sector?: string | null;

  @IsOptional()
  @IsString()
  currency?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
