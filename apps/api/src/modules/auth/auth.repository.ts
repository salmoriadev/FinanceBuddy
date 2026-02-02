import { Injectable } from "@nestjs/common";
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

  createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
  }) {
    return this.prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
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

  revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  revokeUserTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
