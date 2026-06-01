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
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsQueryDto } from "./dto/transactions-query.dto";

@ApiTags("transactions")
@ApiBearerAuth()
@Controller("transactions")
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get()
  findAll(
    @User() user: { id: string },
    @Query() query: TransactionsQueryDto,
  ) {
    return this.service.findAll(user.id, query);
  }

  @Post()
  create(@User() user: { id: string }, @Body() dto: CreateTransactionDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @User() user: { id: string },
    @Param("id") id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(":id")
  delete(@User() user: { id: string }, @Param("id") id: string) {
    return this.service.delete(user.id, id);
  }
}
