/**
 * This file implements Update Investment.Dto behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { PartialType } from "@nestjs/swagger";
import { CreateInvestmentDto } from "./create-investment.dto";

export class UpdateInvestmentDto extends PartialType(CreateInvestmentDto) {}
