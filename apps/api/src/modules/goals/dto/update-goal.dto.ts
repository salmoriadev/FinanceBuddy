/**
 * This file implements Update Goal.Dto behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { PartialType } from "@nestjs/swagger";
import { CreateGoalDto } from "./create-goal.dto";

export class UpdateGoalDto extends PartialType(CreateGoalDto) {}
