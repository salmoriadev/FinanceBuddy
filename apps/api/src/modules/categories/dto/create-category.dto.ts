import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MaxLength(32)
  color!: string;

  @IsString()
  @MaxLength(64)
  icon!: string;

  @IsIn(["income", "expense"])
  type!: "income" | "expense";
}
