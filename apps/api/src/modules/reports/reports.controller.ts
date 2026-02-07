/**
 * This file implements Reports.Controller behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
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

  @Get("summary")
  summary(@User() user: { id: string }, @Query() query: ReportsSummaryQueryDto) {
    return this.service.getSummary(user.id, query.year);
  }
}
