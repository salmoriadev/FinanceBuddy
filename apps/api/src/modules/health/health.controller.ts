import {
  Controller,
  Get,
  Optional,
  ServiceUnavailableException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Controller("health")
export class HealthController {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  @Get()
  health() {
    return { status: "ok" };
  }

  @Get("db")
  async database() {
    if (!this.prisma) {
      throw new ServiceUnavailableException("Database health check unavailable");
    }

    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok", database: "ok" };
  }
}
