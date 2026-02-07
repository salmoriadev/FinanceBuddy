/**
 * This file implements Update Transaction.Dto behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { PartialType } from "@nestjs/swagger";
import { CreateTransactionDto } from "./create-transaction.dto";

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}
