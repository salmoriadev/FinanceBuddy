/**
 * Covers auth controller integration behavior for CSRF-protected cookie
 * endpoints, validating request headers and origin checks end-to-end.
 */
import { ExecutionContext, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AuthController } from "../src/modules/auth/auth.controller";
import { AuthService } from "../src/modules/auth/auth.service";
import { CsrfProtectionGuard } from "../src/common/guards/csrf-protection.guard";
import { JwtAuthGuard } from "../src/common/guards/jwt-auth.guard";

describe("AuthController (integration)", () => {
  let app: INestApplication;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    setRefreshCookie: jest.fn(),
    clearRefreshCookie: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((key: string) => {
      if (key === "NODE_ENV") return "production";
      if (key === "CORS_ORIGIN") return "http://localhost:8080";
      return undefined;
    }),
  };

  const jwtGuardMock = {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = { id: "user-1" };
      return true;
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        CsrfProtectionGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: JwtAuthGuard, useValue: jwtGuardMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /auth/refresh blocks requests without CSRF header", async () => {
    authServiceMock.refresh.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .set("Origin", "http://localhost:8080");

    expect(response.status).toBe(403);
    expect(authServiceMock.refresh).not.toHaveBeenCalled();
  });

  it("POST /auth/refresh blocks requests from invalid origin", async () => {
    authServiceMock.refresh.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Origin", "http://evil.example");

    expect(response.status).toBe(403);
    expect(authServiceMock.refresh).not.toHaveBeenCalled();
  });

  it("POST /auth/refresh accepts valid CSRF header and allowed origin", async () => {
    authServiceMock.refresh.mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "rotated-refresh-token",
    });

    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Origin", "http://localhost:8080");

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ accessToken: "new-access-token" });
    expect(authServiceMock.refresh).toHaveBeenCalledTimes(1);
    expect(authServiceMock.setRefreshCookie).toHaveBeenCalledWith(
      expect.anything(),
      "rotated-refresh-token",
    );
  });

  it("POST /auth/logout enforces CSRF header and clears cookie on success", async () => {
    const blocked = await request(app.getHttpServer())
      .post("/api/v1/auth/logout")
      .set("Origin", "http://localhost:8080");

    expect(blocked.status).toBe(403);

    const allowed = await request(app.getHttpServer())
      .post("/api/v1/auth/logout")
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Origin", "http://localhost:8080");

    expect(allowed.status).toBe(201);
    expect(allowed.body).toEqual({ ok: true });
    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(authServiceMock.clearRefreshCookie).toHaveBeenCalledTimes(1);
  });
});
