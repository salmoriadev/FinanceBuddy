import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { User } from "../../common/decorators/user.decorator";
import { ReportsService } from "./reports.service";
import { ReportsSummaryQueryDto } from "./dto/reports-summary-query.dto";

@ApiTags("reports")
@ApiBearerAuth()
@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get("analytics")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  analytics(@User() user: { id: string }, @Query() query: ReportsSummaryQueryDto) {
    return this.service.getAnalytics(user.id, query.year);
  }

  @Get("summary")
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  summary(@User() user: { id: string }, @Query() query: ReportsSummaryQueryDto) {
    return this.service.getSummary(user.id, query.year);
  }
}
