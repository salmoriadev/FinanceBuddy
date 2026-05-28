import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "../../common/decorators/user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AssetsService } from "./assets.service";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { CreateManualQuoteDto } from "./dto/create-manual-quote.dto";
import { LookupQuoteQueryDto } from "./dto/lookup-quote-query.dto";
import { SearchAssetsQueryDto } from "./dto/search-assets-query.dto";

@ApiTags("assets")
@ApiBearerAuth()
@Controller("assets")
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  @Get()
  findAll(@User() user: { id: string }) {
    return this.service.findAll(user.id);
  }

  @Get("search")
  searchAssets(@Query() query: SearchAssetsQueryDto) {
    return this.service.searchAssets(query);
  }

  @Get(":ticker")
  findByTicker(@User() user: { id: string }, @Param("ticker") ticker: string) {
    return this.service.findByTicker(user.id, ticker);
  }

  @Post()
  create(@User() user: { id: string }, @Body() dto: CreateAssetDto) {
    return this.service.create(user.id, dto);
  }

  @Post(":id/quotes/manual")
  addManualQuote(
    @User() user: { id: string },
    @Param("id") id: string,
    @Body() dto: CreateManualQuoteDto,
  ) {
    return this.service.addManualQuote(user.id, id, dto);
  }

  @Post(":id/quotes/refresh")
  refreshQuote(@User() user: { id: string }, @Param("id") id: string) {
    return this.service.refreshQuote(user.id, id);
  }

  @Get(":id/quotes/lookup")
  lookupQuote(
    @User() user: { id: string },
    @Param("id") id: string,
    @Query() query: LookupQuoteQueryDto,
  ) {
    return this.service.lookupQuote(user.id, id, query);
  }
}
