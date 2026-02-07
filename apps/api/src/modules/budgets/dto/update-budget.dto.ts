/**
 * This file implements Update Budget.Dto behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { PartialType } from "@nestjs/swagger";
import { CreateBudgetDto } from "./create-budget.dto";

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {}
