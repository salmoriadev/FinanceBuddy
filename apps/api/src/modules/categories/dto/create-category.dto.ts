/**
 * This file implements Create Category.Dto behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { IsIn, IsString, MinLength } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  color!: string;

  @IsString()
  icon!: string;

  @IsIn(["income", "expense"])
  type!: "income" | "expense";
}
