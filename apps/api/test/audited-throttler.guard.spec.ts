import { ExecutionContext } from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { AuditedThrottlerGuard } from "../src/modules/security/audited-throttler.guard";
import { SecurityEventService } from "../src/modules/security/security-event.service";

describe("AuditedThrottlerGuard", () => {
  const securityEvents = {
    record: jest.fn(),
  } as unknown as jest.Mocked<SecurityEventService>;

  const guard = new AuditedThrottlerGuard(
    securityEvents,
    [],
    {} as never,
    {} as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    securityEvents.record.mockResolvedValue({} as never);
  });

  it("records rate limit blocks before throwing 429", async () => {
    const request = {
      method: "POST",
      path: "/api/v1/auth/login",
      url: "/api/v1/auth/login",
      originalUrl: "/api/v1/auth/login",
      get: jest.fn(() => "test-agent"),
      ip: "127.0.0.1",
      user: { id: "user-1" },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    await expect(
      (
        guard as unknown as {
          throwThrottlingException: AuditedThrottlerGuard["throwThrottlingException"];
        }
      ).throwThrottlingException(context, {
        limit: 5,
        ttl: 60_000,
        key: "key",
        tracker: "127.0.0.1",
        totalHits: 6,
        timeToExpire: 60,
        isBlocked: true,
        timeToBlockExpire: 60,
      }),
    ).rejects.toBeInstanceOf(ThrottlerException);

    expect(securityEvents.record).toHaveBeenCalledWith({
      userId: "user-1",
      type: "rate_limit_blocked",
      severity: "medium",
      metadata: {
        method: "POST",
        route: "/auth/login",
        limit: 5,
        ttl: 60_000,
        totalHits: 6,
        timeToBlockExpire: 60,
      },
      req: request,
    });
  });

  it("still enforces throttling when the audit write fails", async () => {
    securityEvents.record.mockRejectedValueOnce(new Error("database unavailable"));
    const request = {
      method: "GET",
      path: "/api/v1/reports/analytics",
      url: "/api/v1/reports/analytics",
      originalUrl: "/api/v1/reports/analytics",
      get: jest.fn(),
      ip: "127.0.0.1",
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(
      (
        guard as unknown as {
          throwThrottlingException: AuditedThrottlerGuard["throwThrottlingException"];
        }
      ).throwThrottlingException(context, {
        limit: 20,
        ttl: 60_000,
        key: "key",
        tracker: "127.0.0.1",
        totalHits: 21,
        timeToExpire: 60,
        isBlocked: true,
        timeToBlockExpire: 60,
      }),
    ).rejects.toBeInstanceOf(ThrottlerException);
  });
});
