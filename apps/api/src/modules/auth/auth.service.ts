/**
 * This file implements Auth.Service behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import crypto from "crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { CategoriesService } from "../categories/categories.service";
import { getDefaultCategories } from "../categories/default-categories";

const PASSWORD_RULES = {
  minLength: 8,
  upper: /[A-Z]/,
  lower: /[a-z]/,
  number: /[0-9]/,
  symbol: /[^A-Za-z0-9]/,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async register(dto: RegisterDto, req: Request) {
    const email = dto.email.toLowerCase().trim();
    this.assertPasswordStrength(dto.password);

    const existing = await this.repository.findUserByEmail(email);
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.repository.createUser({
      email,
      passwordHash,
      passwordAlgo: "argon2id",
    });

    await this.ensureDefaultCategories(user.id, user.locale);

    const tokens = await this.issueTokens(user.id, user.email, req);
    return { user: this.safeUser(user), ...tokens };
  }

  async login(dto: LoginDto, req: Request) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.repository.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await this.verifyPassword(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.repository.updateLastLogin(user.id);
    await this.ensureDefaultCategories(user.id, user.locale);
    const tokens = await this.issueTokens(user.id, user.email, req);
    return { user: this.safeUser(user), ...tokens };
  }

  async refresh(req: Request) {
    const refreshToken = this.getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token missing");
    }

    const tokenHash = this.hashRefreshToken(refreshToken);
    const stored = await this.repository.findRefreshTokenByHash(tokenHash);
    if (!stored) {
      throw new UnauthorizedException("Refresh token invalid");
    }

    if (stored.revokedAt) {
      await this.repository.revokeUserTokens(stored.userId);
      throw new UnauthorizedException("Refresh token invalid");
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    const user = await this.repository.findUserById(stored.userId);
    if (!user) {
      throw new UnauthorizedException("Invalid user");
    }

    await this.repository.revokeRefreshToken(stored.id);
    const tokens = await this.issueTokens(stored.userId, user.email, req);
    return tokens;
  }

  async logout(req: Request) {
    const refreshToken = this.getRefreshTokenFromRequest(req);
    if (!refreshToken) return;
    const tokenHash = this.hashRefreshToken(refreshToken);
    const stored = await this.repository.findRefreshTokenByHash(tokenHash);
    if (stored && !stored.revokedAt) {
      await this.repository.revokeRefreshToken(stored.id);
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    this.assertPasswordStrength(dto.newPassword);
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException("Invalid user");
    }
    const valid = await this.verifyPassword(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Current password is invalid");
    }
    const passwordHash = await this.hashPassword(dto.newPassword);
    await this.repository.updatePassword(userId, passwordHash, "argon2id");
    await this.repository.revokeUserTokens(userId);
  }

  async getProfile(userId: string) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException("Invalid user");
    }
    return this.safeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException("Invalid user");
    }

    const updated = await this.repository.updateProfile(userId, {
      name: dto.name?.trim() || null,
      locale: dto.locale,
      currency: dto.currency,
    });

    return this.safeUser(updated);
  }

  setRefreshCookie(res: Response, refreshToken: string) {
    const ttlDays = this.getRefreshTtlDays();
    const cookieOptions = this.getRefreshCookieOptions();
    res.cookie("refresh_token", refreshToken, {
      ...cookieOptions,
      maxAge: ttlDays * 24 * 60 * 60 * 1000,
    });
  }

  clearRefreshCookie(res: Response) {
    res.clearCookie("refresh_token", this.getRefreshCookieOptions());
  }

  private safeUser(user: {
    id: string;
    email: string;
    name?: string | null;
    locale?: string | null;
    currency?: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      locale: user.locale ?? "en",
      currency: user.currency ?? "BRL",
    };
  }

  private async ensureDefaultCategories(userId: string, locale?: string | null) {
    try {
      const existing = await this.categoriesService.findAll(userId);
      if (existing.length > 0) return;
      const defaults = getDefaultCategories(locale ?? undefined);
      await Promise.all(
        defaults.map((category) =>
          this.categoriesService.create(userId, category),
        ),
      );
    } catch {
      // seeding failure should not block auth flow
    }
  }

  private getAccessTtlMinutes() {
    const value = this.configService.get<string>("ACCESS_TOKEN_TTL_MINUTES");
    const parsed = value ? Number(value) : 15;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
  }

  private getRefreshTtlDays() {
    const value = this.configService.get<string>("REFRESH_TOKEN_TTL_DAYS");
    const parsed = value ? Number(value) : 30;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
  }

  private getRefreshCookieOptions() {
    const isProd = this.configService.get<string>("NODE_ENV") === "production";
    const cookieDomain = this.configService.get<string>("COOKIE_DOMAIN");
    const sameSite =
      this.configService.get<string>("COOKIE_SAMESITE") ||
      (isProd ? "none" : "lax");

    return {
      httpOnly: true,
      secure: isProd,
      sameSite: sameSite as "lax" | "strict" | "none",
      path: "/api/v1/auth",
      domain: cookieDomain || undefined,
    };
  }

  private async issueTokens(userId: string, email: string | undefined, req: Request) {
    const accessToken = this.signAccessToken(userId, email);
    const refreshToken = this.generateRefreshToken();
    const tokenHash = this.hashRefreshToken(refreshToken);
    const ttlDays = this.getRefreshTtlDays();
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.repository.createRefreshToken({
      userId,
      tokenHash,
      expiresAt,
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
    });

    return { accessToken, refreshToken };
  }

  private signAccessToken(userId: string, email?: string) {
    const secret = this.getJwtSecret();
    const payload = { sub: userId, email };
    const issuer = this.configService.get<string>("AUTH_JWT_ISSUER");
    const audience = this.configService.get<string>("AUTH_JWT_AUD");
    const expiresIn = this.getAccessTtlMinutes() * 60;

    return jwt.sign(payload, secret, {
      expiresIn,
      issuer: issuer || undefined,
      audience: audience || undefined,
    });
  }

  private getJwtSecret() {
    const secret = this.configService.get<string>("AUTH_JWT_SECRET");
    if (!secret) {
      throw new Error("AUTH_JWT_SECRET is not set");
    }
    return secret;
  }

  private generateRefreshToken() {
    return crypto.randomBytes(48).toString("hex");
  }

  private hashRefreshToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private getPepperedPassword(password: string) {
    const pepper = this.configService.get<string>("PASSWORD_PEPPER");
    if (!pepper) return password;
    return crypto.createHmac("sha256", pepper).update(password).digest();
  }

  private async hashPassword(password: string) {
    const peppered = this.getPepperedPassword(password);
    const memoryCost = Number(
      this.configService.get<string>("ARGON2_MEMORY_KIB") ?? 19456,
    );
    const timeCost = Number(
      this.configService.get<string>("ARGON2_TIME_COST") ?? 2,
    );
    const parallelism = Number(
      this.configService.get<string>("ARGON2_PARALLELISM") ?? 1,
    );
    return argon2.hash(peppered, {
      type: argon2.argon2id,
      memoryCost,
      timeCost,
      parallelism,
    });
  }

  private async verifyPassword(password: string, hash: string) {
    const peppered = this.getPepperedPassword(password);
    try {
      return await argon2.verify(hash, peppered);
    } catch {
      return false;
    }
  }

  private assertPasswordStrength(password: string) {
    if (password.length < PASSWORD_RULES.minLength) {
      throw new BadRequestException(
        "Password must be at least 8 characters long",
      );
    }
    if (!PASSWORD_RULES.upper.test(password)) {
      throw new BadRequestException("Password must include an uppercase letter");
    }
    if (!PASSWORD_RULES.lower.test(password)) {
      throw new BadRequestException("Password must include a lowercase letter");
    }
    if (!PASSWORD_RULES.number.test(password)) {
      throw new BadRequestException("Password must include a number");
    }
    if (!PASSWORD_RULES.symbol.test(password)) {
      throw new BadRequestException("Password must include a symbol");
    }
  }

  private getRefreshTokenFromRequest(req: Request) {
    return req.cookies?.refresh_token ?? null;
  }
}
