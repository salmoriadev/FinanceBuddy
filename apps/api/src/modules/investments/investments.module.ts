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
