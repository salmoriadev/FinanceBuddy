import { Module } from "@nestjs/common";
import { GoalsController } from "./goals.controller";
import { GoalsService } from "./goals.service";
import { GoalsRepository } from "./goals.repository";

@Module({
  controllers: [GoalsController],
  providers: [GoalsService, GoalsRepository],
})
export class GoalsModule {}
