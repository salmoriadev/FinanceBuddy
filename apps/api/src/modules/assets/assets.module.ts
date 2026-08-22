import { Module } from "@nestjs/common";
import { InvestmentMarketDataService } from "../investments/investment-market-data.service";
import { AssetsController } from "./assets.controller";
import { AssetsRepository } from "./assets.repository";
import { AssetsService } from "./assets.service";
import { FixedIncomeValuationService } from "./fixed-income-valuation.service";

@Module({
  controllers: [AssetsController],
  providers: [
    AssetsService,
    AssetsRepository,
    InvestmentMarketDataService,
    FixedIncomeValuationService,
  ],
  exports: [
    AssetsService,
    AssetsRepository,
    InvestmentMarketDataService,
    FixedIncomeValuationService,
  ],
})
export class AssetsModule {}
