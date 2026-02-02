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
