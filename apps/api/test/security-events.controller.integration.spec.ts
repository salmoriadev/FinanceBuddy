import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import request from "supertest";
import { PrismaService } from "../src/database/prisma.service";
import { JwtAuthGuard } from "../src/common/guards/jwt-auth.guard";
import { SecurityAdminGuard } from "../src/modules/security/security-admin.guard";
import { SecurityEventService } from "../src/modules/security/security-event.service";
import { SecurityEventsController } from "../src/modules/security/security-events.controller";

describe("SecurityEventsController (integration)", () => {
  let app: INestApplication;
  const prisma = {
    securityEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === "AUTH_JWT_SECRET") return "test-secret";
      if (key === "SECURITY_ADMIN_EMAILS") return "admin@example.com";
      return undefined;
    }),
  };

  const tokenFor = (email: string) =>
    jwt.sign(
      { sub: "00000000-0000-4000-8000-000000000001", email },
      "test-secret",
      { algorithm: "HS256" },
    );

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SecurityEventsController],
      providers: [
        SecurityEventService,
        SecurityAdminGuard,
        JwtAuthGuard,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
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

  it("returns 401 without JWT", async () => {
    const response = await request(app.getHttpServer()).get(
      "/api/v1/security/events",
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 for authenticated users outside the allowlist", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/security/events")
      .set("Authorization", `Bearer ${tokenFor("user@example.com")}`);

    expect(response.status).toBe(403);
  });

  it("returns newest-first filtered events for allowlisted admins", async () => {
    prisma.securityEvent.findMany.mockResolvedValue([
      {
        id: "event-1",
        userId: null,
        type: "rate_limit_blocked",
        severity: "medium",
        metadata: { route: "/auth/login" },
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
      },
    ]);

    const response = await request(app.getHttpServer())
      .get(
        "/api/v1/security/events?type=rate_limit_blocked&severity=medium&limit=10",
      )
      .set("Authorization", `Bearer ${tokenFor("admin@example.com")}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: "event-1",
        userId: null,
        type: "rate_limit_blocked",
        severity: "medium",
        metadata: { route: "/auth/login" },
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
        createdAt: "2026-06-01T10:00:00.000Z",
      },
    ]);
    expect(prisma.securityEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: "rate_limit_blocked",
          severity: "medium",
        }),
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    );
  });

  it("rejects limit values above 100", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/security/events?limit=101")
      .set("Authorization", `Bearer ${tokenFor("admin@example.com")}`);

    expect(response.status).toBe(400);
    expect(prisma.securityEvent.findMany).not.toHaveBeenCalled();
  });
});
