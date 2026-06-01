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
