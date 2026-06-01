/**
 * This file implements Auth.Repository behavior for the backend module layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  createUser(data: { email: string; passwordHash: string; passwordAlgo: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        passwordAlgo: data.passwordAlgo,
      },
    });
  }

  updatePassword(userId: string, passwordHash: string, passwordAlgo: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordAlgo },
    });
  }

  updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  updateProfile(userId: string, data: {
    name?: string | null;
    locale?: string;
    currency?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
  }) {
    return this.prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        familyId: data.familyId,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent ?? null,
        ipAddress: data.ipAddress ?? null,
      },
    });
  }

  findRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: { tokenHash },
    });
  }

  revokeRefreshToken(id: string, replacedByTokenId?: string | null) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: replacedByTokenId ?? undefined,
      },
    });
  }

  revokeUserTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  revokeTokenFamily(userId: string, familyId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  createSecurityEvent(data: {
    userId?: string | null;
    type: string;
    severity: "info" | "medium" | "high" | "critical";
    metadata?: Prisma.InputJsonObject;
    userAgent?: string | null;
    ipAddress?: string | null;
  }) {
    return this.prisma.securityEvent.create({
      data: {
        userId: data.userId ?? null,
        type: data.type,
        severity: data.severity,
        metadata: data.metadata,
        userAgent: data.userAgent ?? null,
        ipAddress: data.ipAddress ?? null,
      },
    });
  }
}
