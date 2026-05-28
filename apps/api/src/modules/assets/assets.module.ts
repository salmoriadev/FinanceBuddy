import { Module } from "@nestjs/common";
import { InvestmentMarketDataService } from "../investments/investment-market-data.service";
import { AssetsController } from "./assets.controller";
import { AssetsRepository } from "./assets.repository";
import { AssetsService } from "./assets.service";

@Module({
  controllers: [AssetsController],
  providers: [AssetsService, AssetsRepository, InvestmentMarketDataService],
  exports: [AssetsService, AssetsRepository],
})
export class AssetsModule {}
