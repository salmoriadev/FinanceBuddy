import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import crypto from "crypto";
import { AuthRepository } from "../src/modules/auth/auth.repository";
import { AuthService } from "../src/modules/auth/auth.service";
import { CategoriesService } from "../src/modules/categories/categories.service";

const hashRefreshToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

describe("AuthService", () => {
  const repository = {
    findRefreshTokenByHash: jest.fn(),
    revokeUserTokens: jest.fn(),
  } as unknown as jest.Mocked<AuthRepository>;
  const configService = {
    get: jest.fn(),
  } as unknown as jest.Mocked<ConfigService>;
  const categoriesService = {} as unknown as jest.Mocked<CategoriesService>;
  const service = new AuthService(repository, configService, categoriesService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const requestWithRefreshToken = (token: string) =>
    ({
      cookies: {
        refresh_token: token,
      },
    }) as unknown as Request;

  it("revokes active sessions when a revoked refresh token is reused", async () => {
    const rawToken = "stolen-old-refresh-token";
    repository.findRefreshTokenByHash.mockResolvedValue({
      id: "refresh-token-id",
      userId: "user-id",
      tokenHash: hashRefreshToken(rawToken),
      userAgent: "test-agent",
      ipAddress: "127.0.0.1",
      createdAt: new Date("2026-05-31T10:00:00.000Z"),
      expiresAt: new Date("2026-06-30T10:00:00.000Z"),
      revokedAt: new Date("2026-05-31T10:05:00.000Z"),
    });
    repository.revokeUserTokens.mockResolvedValue({ count: 2 });

    await expect(
      service.refresh(requestWithRefreshToken(rawToken)),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(repository.findRefreshTokenByHash).toHaveBeenCalledWith(
      hashRefreshToken(rawToken),
    );
    expect(repository.revokeUserTokens).toHaveBeenCalledWith("user-id");
  });

  it("does not revoke user sessions for an unknown refresh token", async () => {
    repository.findRefreshTokenByHash.mockResolvedValue(null);

    await expect(
      service.refresh(requestWithRefreshToken("unknown-refresh-token")),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(repository.revokeUserTokens).not.toHaveBeenCalled();
  });
});
