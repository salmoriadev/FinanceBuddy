import { INestApplication, ValidationPipe } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import request from "supertest";
import { AuthService } from "../src/modules/auth/auth.service";
import { MobileAuthController } from "../src/modules/auth/mobile-auth.controller";
import { MobileJsonGuard } from "../src/modules/auth/mobile-json.guard";

describe("MobileAuthController (integration)", () => {
  let app: INestApplication;
  const refreshToken = "a".repeat(96);
  const rotatedRefreshToken = "b".repeat(96);
  const user = {
    id: "user-1",
    email: "user@example.com",
    locale: "pt-BR",
    currency: "BRL",
  };
  const credentials = { email: user.email, password: "Password1!" };
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshWithToken: jest.fn(),
    logoutWithToken: jest.fn(),
    setRefreshCookie: jest.fn(),
    clearRefreshCookie: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const authResult = {
      user,
      accessToken: "access-token",
      refreshToken,
      refreshTokenId: "internal-id",
    };
    authService.login.mockResolvedValue(authResult);
    authService.register.mockResolvedValue(authResult);
    authService.refreshWithToken.mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: rotatedRefreshToken,
      refreshTokenId: "internal-replacement-id",
    });

    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
      controllers: [MobileAuthController],
      providers: [
        MobileJsonGuard,
        { provide: AuthService, useValue: authService },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
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

  afterEach(async () => {
    await app.close();
  });

  it.each(["login", "register"] as const)(
    "%s returns explicit tokens without cookies or CSRF",
    async (route) => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/auth/mobile/${route}`)
        .send(credentials);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ user, accessToken: "access-token", refreshToken });
      expect(response.headers["set-cookie"]).toBeUndefined();
      expect(response.headers["cache-control"]).toBe("no-store");
      expect(authService[route]).toHaveBeenCalledWith(credentials, expect.anything());
      expect(authService.setRefreshCookie).not.toHaveBeenCalled();
    },
  );

  it.each(["login", "register"] as const)("%s validates credentials", async (route) => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/auth/mobile/${route}`)
      .send({ email: "not-an-email", password: "short" });

    expect(response.status).toBe(400);
    expect(authService[route]).not.toHaveBeenCalled();
  });

  it.each(["login", "register", "refresh", "logout"])(
    "%s rejects form submissions",
    async (route) => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/auth/mobile/${route}`)
        .type("form")
        .send(
          route === "login" || route === "register" ? credentials : { refreshToken },
        );

      expect(response.status).toBe(415);
      expect(authService.login).not.toHaveBeenCalled();
      expect(authService.register).not.toHaveBeenCalled();
      expect(authService.refreshWithToken).not.toHaveBeenCalled();
      expect(authService.logoutWithToken).not.toHaveBeenCalled();
    },
  );

  it("refresh rotates only the supplied body token and never writes browser cookies", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/mobile/refresh")
      .set("Cookie", [`refresh_token=${"c".repeat(96)}`])
      .send({ refreshToken });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      accessToken: "new-access-token",
      refreshToken: rotatedRefreshToken,
    });
    expect(response.headers["set-cookie"]).toBeUndefined();
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(authService.refreshWithToken).toHaveBeenCalledWith(
      refreshToken,
      expect.anything(),
    );
    expect(authService.setRefreshCookie).not.toHaveBeenCalled();
  });

  it.each(["refresh", "logout"])("%s rejects cookie-only authentication", async (route) => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/auth/mobile/${route}`)
      .set("Cookie", [`refresh_token=${refreshToken}`])
      .send({});

    expect(response.status).toBe(400);
    expect(authService.refreshWithToken).not.toHaveBeenCalled();
    expect(authService.logoutWithToken).not.toHaveBeenCalled();
  });

  it.each([null, 123, "", "a".repeat(95), "a".repeat(97), "g".repeat(96), [refreshToken]])(
    "rejects a malformed refresh token %j",
    async (invalidToken) => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/mobile/refresh")
        .send({ refreshToken: invalidToken });

      expect(response.status).toBe(400);
      expect(authService.refreshWithToken).not.toHaveBeenCalled();
    },
  );

  it("logout revokes the explicit native token without clearing browser cookies", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/mobile/logout")
      .set("Cookie", [`refresh_token=${"c".repeat(96)}`])
      .send({ refreshToken });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ ok: true });
    expect(response.headers["set-cookie"]).toBeUndefined();
    expect(authService.logoutWithToken).toHaveBeenCalledWith(
      refreshToken,
      expect.anything(),
    );
    expect(authService.clearRefreshCookie).not.toHaveBeenCalled();
  });

  it.each([
    { route: "login", limit: 5 },
    { route: "register", limit: 3 },
    { route: "refresh", limit: 10 },
    { route: "logout", limit: 10 },
  ])("limits $route to $limit requests per minute", async ({ route, limit }) => {
    for (let index = 0; index < limit; index += 1) {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/auth/mobile/${route}`)
        .send(
          route === "login" || route === "register" ? credentials : { refreshToken },
        );
      expect(response.status).toBe(201);
    }

    const response = await request(app.getHttpServer())
      .post(`/api/v1/auth/mobile/${route}`)
      .send(
        route === "login" || route === "register" ? credentials : { refreshToken },
      );

    expect(response.status).toBe(429);
  });
});
