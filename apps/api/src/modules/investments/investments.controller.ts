import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { User } from "../../common/decorators/user.decorator";
import { InvestmentsService } from "./investments.service";
import { CreateInvestmentDto } from "./dto/create-investment.dto";
import { UpdateInvestmentDto } from "./dto/update-investment.dto";
import { SearchAssetsQueryDto } from "./dto/search-assets-query.dto";
import { RefreshInvestmentQuotesDto } from "./dto/refresh-investment-quotes.dto";

@ApiTags("investments")
@ApiBearerAuth()
@Controller("investments")
@UseGuards(JwtAuthGuard)
export class InvestmentsController {
  constructor(private readonly service: InvestmentsService) {}

  @Get()
  findAll(@User() user: { id: string }) {
    return this.service.findAll(user.id);
  }

  @Get("assets/search")
  searchAssets(@Query() query: SearchAssetsQueryDto) {
    return this.service.searchAssets(query.q, query.type);
  }

  @Post("market-data/refresh")
  refreshMarketData(
    @User() user: { id: string },
    @Body() dto: RefreshInvestmentQuotesDto,
  ) {
    return this.service.refreshMarketData(user.id, dto.ids);
  }

  @Post()
  create(@User() user: { id: string }, @Body() dto: CreateInvestmentDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @User() user: { id: string },
    @Param("id") id: string,
    @Body() dto: UpdateInvestmentDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(":id")
  delete(@User() user: { id: string }, @Param("id") id: string) {
    return this.service.delete(user.id, id);
  }
}
