import { Body, Controller, Header, Post, Req, UseGuards } from "@nestjs/common";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { MobileRefreshTokenDto } from "./dto/mobile-refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { MobileJsonGuard } from "./mobile-json.guard";

/** Native sessions transport credentials explicitly and never read/write cookies. */
@ApiTags("auth")
@ApiConsumes("application/json")
@Controller("auth/mobile")
@UseGuards(MobileJsonGuard)
export class MobileAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Header("Cache-Control", "no-store")
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const { user, accessToken, refreshToken } = await this.authService.register(
      dto,
      req,
    );
    return { user, accessToken, refreshToken };
  }

  @Post("login")
  @Header("Cache-Control", "no-store")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const { user, accessToken, refreshToken } = await this.authService.login(
      dto,
      req,
    );
    return { user, accessToken, refreshToken };
  }

  @Post("refresh")
  @Header("Cache-Control", "no-store")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refresh(@Body() dto: MobileRefreshTokenDto, @Req() req: Request) {
    const { accessToken, refreshToken } = await this.authService.refreshWithToken(
      dto.refreshToken,
      req,
    );
    return { accessToken, refreshToken };
  }

  @Post("logout")
  @Header("Cache-Control", "no-store")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async logout(@Body() dto: MobileRefreshTokenDto, @Req() req: Request) {
    await this.authService.logoutWithToken(dto.refreshToken, req);
    return { ok: true };
  }
}
