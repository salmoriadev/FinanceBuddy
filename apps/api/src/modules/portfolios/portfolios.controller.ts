import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "../../common/decorators/user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateDividendReceiptDto } from "./dto/create-dividend-receipt.dto";
import { CreatePortfolioDto } from "./dto/create-portfolio.dto";
import { CreatePortfolioTransactionDto } from "./dto/create-portfolio-transaction.dto";
import { MonthlyReportQueryDto } from "./dto/monthly-report-query.dto";
import { ReceiveDividendReceiptDto } from "./dto/receive-dividend-receipt.dto";
import { PortfoliosService } from "./portfolios.service";

@ApiTags("portfolios")
@ApiBearerAuth()
@Controller("portfolios")
@UseGuards(JwtAuthGuard)
export class PortfoliosController {
  constructor(private readonly service: PortfoliosService) {}

  @Get()
  findAll(@User() user: { id: string }) {
    return this.service.findAll(user.id);
  }

  @Post()
  create(@User() user: { id: string }, @Body() dto: CreatePortfolioDto) {
    return this.service.create(user.id, dto);
  }

  @Get(":id/positions")
  getPositions(@User() user: { id: string }, @Param("id") id: string) {
    return this.service.getPositions(user.id, id);
  }

  @Post(":id/transactions")
  addTransaction(
    @User() user: { id: string },
    @Param("id") id: string,
    @Body() dto: CreatePortfolioTransactionDto,
  ) {
    return this.service.addTransaction(user.id, id, dto);
  }

  @Get(":id/dividends")
  getDividends(@User() user: { id: string }, @Param("id") id: string) {
    return this.service.getDividends(user.id, id);
  }

  @Post(":id/dividends")
  createDividend(
    @User() user: { id: string },
    @Param("id") id: string,
    @Body() dto: CreateDividendReceiptDto,
  ) {
    return this.service.createDividend(user.id, id, dto);
  }

  @Post(":id/dividends/:receiptId/receive")
  receiveDividend(
    @User() user: { id: string },
    @Param("id") id: string,
    @Param("receiptId") receiptId: string,
    @Body() dto: ReceiveDividendReceiptDto,
  ) {
    return this.service.receiveDividend(user.id, id, receiptId, dto);
  }

  @Get(":id/reports/monthly")
  getMonthlyReport(
    @User() user: { id: string },
    @Param("id") id: string,
    @Query() query: MonthlyReportQueryDto,
  ) {
    return this.service.getMonthlyReport(user.id, id, query.month);
  }

  @Get(":id/audit")
  getAudit(@User() user: { id: string }, @Param("id") id: string) {
    return this.service.getAudit(user.id, id);
  }

  @Post(":id/quotes/refresh")
  refreshQuotes(@User() user: { id: string }, @Param("id") id: string) {
    return this.service.refreshQuotes(user.id, id);
  }
}
