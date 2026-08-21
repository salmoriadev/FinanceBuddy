import { ExecutionContext } from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { ThrottlerLimitDetail } from "@nestjs/throttler/dist/throttler.guard.interface";
import { AuditedThrottlerGuard } from "../src/modules/security/audited-throttler.guard";
import { SecurityEventService } from "../src/modules/security/security-event.service";

const requestFor = (route: string, ip: string) => ({
  method: "GET",
  path: `/api/v1${route}`,
  url: `/api/v1${route}`,
  originalUrl: `/api/v1${route}`,
  get: jest.fn(() => "test-agent"),
  ip,
  user: { id: "user-1" },
});

const contextFor = (request: ReturnType<typeof requestFor>) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

const limitDetail = (
  tracker: string,
  key = `default:${tracker}`,
): ThrottlerLimitDetail => ({
  limit: 5,
  ttl: 60_000,
  key,
  tracker,
  totalHits: 6,
  timeToExpire: 60,
  isBlocked: true,
  timeToBlockExpire: 60,
});

const throwBlocked = (
  guard: AuditedThrottlerGuard,
  context: ExecutionContext,
  detail: ThrottlerLimitDetail,
) =>
  (
    guard as unknown as {
      throwThrottlingException: AuditedThrottlerGuard["throwThrottlingException"];
    }
  ).throwThrottlingException(context, detail);

describe("AuditedThrottlerGuard", () => {
  const securityEvents = {
    record: jest.fn(),
  } as unknown as jest.Mocked<SecurityEventService>;

  let guard: AuditedThrottlerGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    securityEvents.record.mockResolvedValue({} as never);
    guard = new AuditedThrottlerGuard(
      securityEvents,
      [],
      {} as never,
      {} as never,
    );
  });

  it("records the first block without delaying the 429 response", async () => {
    securityEvents.record.mockReturnValueOnce(new Promise(() => {}) as never);
    const request = requestFor("/auth/login", "127.0.0.1");

    await expect(
      throwBlocked(
        guard,
        contextFor(request),
        limitDetail("127.0.0.1", "default-login-key"),
      ),
    ).rejects.toBeInstanceOf(ThrottlerException);
    await Promise.resolve();

    expect(securityEvents.record).toHaveBeenCalledWith({
      userId: "user-1",
      type: "rate_limit_blocked",
      severity: "medium",
      metadata: {
        method: "GET",
        route: "/auth/login",
        limit: 5,
        ttl: 60_000,
        totalHits: 6,
        timeToBlockExpire: 60,
      },
      req: request,
    });
  });

  it("records at most one event for repeated blocks in the same window", async () => {
    const request = requestFor("/reports/analytics", "127.0.0.1");
    const context = contextFor(request);
    const detail = limitDetail("127.0.0.1", "default-reports-key");

    await expect(throwBlocked(guard, context, detail)).rejects.toBeInstanceOf(
      ThrottlerException,
    );
    await expect(throwBlocked(guard, context, detail)).rejects.toBeInstanceOf(
      ThrottlerException,
    );
    await Promise.resolve();

    expect(securityEvents.record).toHaveBeenCalledTimes(1);
  });

  it("records distinct trackers, routes, and throttler keys independently", async () => {
    const cases = [
      [requestFor("/reports/analytics", "127.0.0.1"), "default-key"],
      [requestFor("/reports/analytics", "127.0.0.2"), "default-key"],
      [requestFor("/auth/login", "127.0.0.1"), "default-key"],
      [requestFor("/reports/analytics", "127.0.0.1"), "strict-key"],
    ] as const;

    for (const [request, key] of cases) {
      await expect(
        throwBlocked(guard, contextFor(request), limitDetail(request.ip, key)),
      ).rejects.toBeInstanceOf(ThrottlerException);
    }
    await Promise.resolve();

    expect(securityEvents.record).toHaveBeenCalledTimes(4);
  });

  it("bounds the block deduplication cache", () => {
    const cache = (
      guard as unknown as {
        auditedBlocks: {
          get: (key: string) => true | null;
          set: (key: string, value: true) => void;
          size: number;
        };
      }
    ).auditedBlocks;

    for (let index = 0; index <= 10_000; index += 1) {
      cache.set(`block-${index}`, true);
    }

    expect(cache.size).toBe(10_000);
    expect(cache.get("block-0")).toBeNull();
    expect(cache.get("block-10000")).toBe(true);
  });

  it("handles failed audit writes without unhandled rejection", async () => {
    securityEvents.record.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(
      throwBlocked(
        guard,
        contextFor(requestFor("/reports/analytics", "127.0.0.1")),
        limitDetail("127.0.0.1"),
      ),
    ).rejects.toBeInstanceOf(ThrottlerException);
    await Promise.resolve();

    expect(securityEvents.record).toHaveBeenCalledTimes(1);
  });
});
