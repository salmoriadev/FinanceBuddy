import { Module } from "@nestjs/common";
import { AssetsModule } from "../assets/assets.module";
import { PortfoliosController } from "./portfolios.controller";
import { PortfoliosRepository } from "./portfolios.repository";
import { PortfoliosService } from "./portfolios.service";

@Module({
  imports: [AssetsModule],
  controllers: [PortfoliosController],
  providers: [PortfoliosService, PortfoliosRepository],
})
export class PortfoliosModule {}
