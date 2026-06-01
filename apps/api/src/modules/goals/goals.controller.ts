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
import { GoalsService } from "./goals.service";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";

@ApiTags("goals")
@ApiBearerAuth()
@Controller("goals")
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly service: GoalsService) {}

  @Get()
  findAll(@User() user: { id: string }) {
    return this.service.findAll(user.id);
  }

  @Post()
  create(@User() user: { id: string }, @Body() dto: CreateGoalDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @User() user: { id: string },
    @Param("id") id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(":id")
  delete(@User() user: { id: string }, @Param("id") id: string) {
    return this.service.delete(user.id, id);
  }
}
