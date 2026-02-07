/**
 * This file implements Transactions.Module behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { Module } from "@nestjs/common";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { TransactionsRepository } from "./transactions.repository";
import { RecurringTransactionsService } from "./recurring.service";

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsRepository, RecurringTransactionsService],
  exports: [RecurringTransactionsService],
})
export class TransactionsModule {}
