/**
 * This file implements Auth.Module behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { PrismaModule } from "../../database/prisma.module";
import { CategoriesModule } from "../categories/categories.module";
import { CsrfProtectionGuard } from "../../common/guards/csrf-protection.guard";

@Module({
  imports: [PrismaModule, CategoriesModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, CsrfProtectionGuard],
})
export class AuthModule {}
