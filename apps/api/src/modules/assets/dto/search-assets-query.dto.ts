import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ASSET_CLASSES, AssetClassValue } from "./create-asset.dto";

export class SearchAssetsQueryDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  q!: string;

  @IsOptional()
  @IsIn(ASSET_CLASSES)
  class?: AssetClassValue;
}
