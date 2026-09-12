import { Type, Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { MAX_MONEY_VALUE } from "../../../common/validators/financial-values";

export class ImportTransactionItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  description!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0.01)
  @Max(MAX_MONEY_VALUE)
  amount!: number;

  @IsIn(["income", "expense"])
  type!: "income" | "expense";

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  date!: string;
}

export class ImportTransactionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ImportTransactionItemDto)
  transactions!: ImportTransactionItemDto[];
}
