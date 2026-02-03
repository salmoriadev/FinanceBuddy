import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string | null;

  @IsOptional()
  @IsIn(["en", "pt-BR"])
  locale?: "en" | "pt-BR";

  @IsOptional()
  @IsIn(["BRL", "USD"])
  currency?: "BRL" | "USD";
}
