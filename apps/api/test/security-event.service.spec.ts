import { SecurityEventService } from "../src/modules/security/security-event.service";
import { PrismaService } from "../src/database/prisma.service";

describe("SecurityEventService", () => {
  const prisma = {
    securityEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const service = new SecurityEventService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records request ip and user agent while sanitizing sensitive metadata", async () => {
    const req = {
      get: jest.fn((name: string) =>
        name === "user-agent" ? "test-agent" : undefined,
      ),
      ip: "127.0.0.1",
    };
    (prisma.securityEvent.create as jest.Mock).mockResolvedValue({} as never);

    await service.record({
      userId: "00000000-0000-4000-8000-000000000001",
      type: "login_failed",
      severity: "medium",
      metadata: {
        email: "raw@example.com",
        emailHash: "abc123",
        RefreshTOKEN: "secret",
        nested: { AUTHORIZATION: "Bearer secret", reason: "invalid" },
      },
      req: req as never,
    });

    expect(prisma.securityEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "00000000-0000-4000-8000-000000000001",
        type: "login_failed",
        severity: "medium",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
        metadata: {
          email: "[redacted]",
          emailHash: "abc123",
          nested: { reason: "invalid" },
        },
      }),
    });
  });
});
