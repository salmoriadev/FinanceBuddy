import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import crypto from "crypto";
import { AuthRepository } from "../src/modules/auth/auth.repository";
import { AuthService } from "../src/modules/auth/auth.service";
import { CategoriesService } from "../src/modules/categories/categories.service";
import { SecurityEventService } from "../src/modules/security/security-event.service";

const hashRefreshToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

describe("AuthService", () => {
  const repository = {
    findUserByEmail: jest.fn(),
    findRefreshTokenByHash: jest.fn(),
    revokeUserTokens: jest.fn(),
    revokeTokenFamily: jest.fn(),
    findUserById: jest.fn(),
    updateLastLogin: jest.fn(),
    createRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
  } as unknown as jest.Mocked<AuthRepository>;
  const configService = {
    get: jest.fn(),
  } as unknown as jest.Mocked<ConfigService>;
  const categoriesService = {} as unknown as jest.Mocked<CategoriesService>;
  const securityEvents = {
    record: jest.fn(),
  } as unknown as jest.Mocked<SecurityEventService>;
  const service = new AuthService(
    repository,
    configService,
    categoriesService,
    securityEvents,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    securityEvents.record.mockResolvedValue({} as never);
  });

  const requestWithRefreshToken = (token: string) =>
    ({
      cookies: {
        refresh_token: token,
      },
      get: jest.fn(() => "test-agent"),
      ip: "127.0.0.1",
    }) as unknown as Request;

  it("records failed login attempts without storing raw email addresses", async () => {
    repository.findUserByEmail.mockResolvedValue(null);

    await expect(
      service.login(
        { email: "Missing.User@example.com", password: "bad-password" },
        requestWithRefreshToken("unused"),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(securityEvents.record).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "login_failed",
        severity: "medium",
        req: expect.anything(),
        metadata: expect.objectContaining({
          reason: "user_not_found",
          emailHash: expect.any(String),
        }),
      }),
    );
    expect(
      securityEvents.record.mock.calls[0]?.[0].metadata?.emailHash,
    ).not.toContain("Missing.User");
  });

  it("revokes active sessions when a revoked refresh token is reused", async () => {
    const rawToken = "stolen-old-refresh-token";
    repository.findRefreshTokenByHash.mockResolvedValue({
      id: "refresh-token-id",
      userId: "user-id",
      tokenHash: hashRefreshToken(rawToken),
      familyId: "family-id",
      replacedByTokenId: "replacement-token-id",
      userAgent: "test-agent",
      ipAddress: "127.0.0.1",
      createdAt: new Date("2026-05-31T10:00:00.000Z"),
      expiresAt: new Date("2026-06-30T10:00:00.000Z"),
      revokedAt: new Date("2026-05-31T10:05:00.000Z"),
    });
    repository.revokeTokenFamily.mockResolvedValue({ count: 2 });
    await expect(
      service.refresh(requestWithRefreshToken(rawToken)),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(repository.findRefreshTokenByHash).toHaveBeenCalledWith(
      hashRefreshToken(rawToken),
    );
    expect(securityEvents.record).toHaveBeenCalledWith({
      userId: "user-id",
      type: "refresh_token_reuse",
      severity: "high",
      metadata: {
        refreshTokenId: "refresh-token-id",
        familyId: "family-id",
        replacedByTokenId: "replacement-token-id",
      },
      req: expect.anything(),
    });
    expect(repository.revokeTokenFamily).toHaveBeenCalledWith(
      "user-id",
      "family-id",
    );
  });

  it("does not revoke user sessions for an unknown refresh token", async () => {
    repository.findRefreshTokenByHash.mockResolvedValue(null);

    await expect(
      service.refresh(requestWithRefreshToken("unknown-refresh-token")),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(repository.revokeUserTokens).not.toHaveBeenCalled();
    expect(repository.revokeTokenFamily).not.toHaveBeenCalled();
  });

  it("rotates valid refresh tokens inside the same token family", async () => {
    const rawToken = "current-refresh-token";
    const request = {
      ...requestWithRefreshToken(rawToken),
      get: jest.fn(() => "test-agent"),
      ip: "127.0.0.1",
    } as unknown as Request;

    repository.findRefreshTokenByHash.mockResolvedValue({
      id: "old-refresh-token-id",
      userId: "user-id",
      tokenHash: hashRefreshToken(rawToken),
      familyId: "family-id",
      replacedByTokenId: null,
      userAgent: "test-agent",
      ipAddress: "127.0.0.1",
      createdAt: new Date("2026-05-31T10:00:00.000Z"),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    repository.findUserById.mockResolvedValue({
      id: "user-id",
      email: "user@example.com",
      name: null,
      locale: "pt-BR",
      currency: "BRL",
      passwordHash: "hash",
      passwordAlgo: "argon2id",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    });
    repository.createRefreshToken.mockResolvedValue({
      id: "new-refresh-token-id",
      userId: "user-id",
      tokenHash: "new-token-hash",
      familyId: "family-id",
      replacedByTokenId: null,
      userAgent: "test-agent",
      ipAddress: "127.0.0.1",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    repository.revokeRefreshToken.mockResolvedValue({} as never);
    configService.get.mockImplementation((key: string) => {
      if (key === "AUTH_JWT_SECRET") return "test-secret";
      if (key === "ACCESS_TOKEN_TTL_MINUTES") return "15";
      if (key === "REFRESH_TOKEN_TTL_DAYS") return "30";
      return undefined;
    });

    const result = await service.refresh(request);

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(repository.createRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-id",
        familyId: "family-id",
      }),
    );
    expect(repository.revokeRefreshToken).toHaveBeenCalledWith(
      "old-refresh-token-id",
      "new-refresh-token-id",
    );
    expect(securityEvents.record).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-id",
        type: "refresh_token_rotated",
        severity: "info",
        metadata: expect.objectContaining({
          refreshTokenId: "old-refresh-token-id",
          familyId: "family-id",
          replacedByTokenId: "new-refresh-token-id",
        }),
      }),
    );
  });
});
