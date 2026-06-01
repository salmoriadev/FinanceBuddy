import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { User } from "../../common/decorators/user.decorator";
import { BudgetsService } from "./budgets.service";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

@ApiTags("budgets")
@ApiBearerAuth()
@Controller("budgets")
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}

  @Get()
  findAll(@User() user: { id: string }) {
    return this.service.findAll(user.id);
  }

  @Post()
  create(@User() user: { id: string }, @Body() dto: CreateBudgetDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @User() user: { id: string },
    @Param("id") id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(":id")
  delete(@User() user: { id: string }, @Param("id") id: string) {
    return this.service.delete(user.id, id);
  }
}
