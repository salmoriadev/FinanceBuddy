import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SecurityAdminGuard } from "./security-admin.guard";
import { SecurityEventService } from "./security-event.service";
import { SecurityEventsQueryDto } from "./dto/security-events-query.dto";

@ApiTags("security")
@ApiBearerAuth()
@Controller("security/events")
@UseGuards(JwtAuthGuard, SecurityAdminGuard)
export class SecurityEventsController {
  constructor(private readonly securityEvents: SecurityEventService) {}

  @Get()
  list(@Query() query: SecurityEventsQueryDto) {
    return this.securityEvents.list(query);
  }
}
