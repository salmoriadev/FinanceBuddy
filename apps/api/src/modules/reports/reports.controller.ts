import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { User } from "../../common/decorators/user.decorator";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@ApiBearerAuth()
@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get("summary")
  summary(@User() user: { id: string }, @Query("year") year?: string) {
    const parsedYear = year ? Number(year) : undefined;
    return this.service.getSummary(user.id, parsedYear);
  }
}
