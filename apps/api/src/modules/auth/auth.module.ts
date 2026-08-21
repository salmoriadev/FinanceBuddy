import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { PrismaModule } from "../../database/prisma.module";
import { CategoriesModule } from "../categories/categories.module";
import { CsrfProtectionGuard } from "../../common/guards/csrf-protection.guard";
import { SecurityModule } from "../security/security.module";

@Module({
  imports: [PrismaModule, CategoriesModule, SecurityModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, CsrfProtectionGuard],
})
export class AuthModule {}
