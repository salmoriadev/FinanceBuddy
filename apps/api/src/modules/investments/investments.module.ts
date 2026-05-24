/**
 * This file implements Investments.Module behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { Module } from "@nestjs/common";
import { InvestmentsController } from "./investments.controller";
import { InvestmentsService } from "./investments.service";
import { InvestmentsRepository } from "./investments.repository";
import { InvestmentMarketDataService } from "./investment-market-data.service";

@Module({
  controllers: [InvestmentsController],
  providers: [
    InvestmentsService,
    InvestmentsRepository,
    InvestmentMarketDataService,
  ],
})
export class InvestmentsModule {}
