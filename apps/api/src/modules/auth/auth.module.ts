import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { PrismaModule } from "../../database/prisma.module";
import { CategoriesModule } from "../categories/categories.module";
import { CsrfProtectionGuard } from "../../common/guards/csrf-protection.guard";
import { SecurityModule } from "../security/security.module";
import { MobileAuthController } from "./mobile-auth.controller";
import { MobileJsonGuard } from "./mobile-json.guard";

@Module({
  imports: [PrismaModule, CategoriesModule, SecurityModule],
  controllers: [AuthController, MobileAuthController],
  providers: [AuthService, AuthRepository, CsrfProtectionGuard, MobileJsonGuard],
})
export class AuthModule {}
