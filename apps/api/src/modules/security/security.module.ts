import { Module } from "@nestjs/common";
import { PrismaModule } from "../../database/prisma.module";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SecurityAdminGuard } from "./security-admin.guard";
import { SecurityEventService } from "./security-event.service";
import { SecurityEventsController } from "./security-events.controller";

@Module({
  imports: [PrismaModule],
  controllers: [SecurityEventsController],
  providers: [SecurityEventService, SecurityAdminGuard, JwtAuthGuard],
  exports: [SecurityEventService, SecurityAdminGuard],
})
export class SecurityModule {}
