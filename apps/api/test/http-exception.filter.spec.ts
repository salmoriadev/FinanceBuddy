import {
  ArgumentsHost,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { SecurityEventService } from "../src/modules/security/security-event.service";

const createHost = (request: Record<string, unknown>) => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  return {
    host: {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost,
    response,
  };
};

describe("HttpExceptionFilter", () => {
  const securityEvents = {
    record: jest.fn(),
  } as unknown as jest.Mocked<SecurityEventService>;

  let filter: HttpExceptionFilter;

  beforeEach(() => {
    jest.clearAllMocks();
    securityEvents.record.mockResolvedValue({} as never);
    filter = new HttpExceptionFilter(securityEvents);
  });

  it("records repeated authorization failures on the fifth failure in ten minutes", async () => {
    const request = {
      method: "GET",
      path: "/api/v1/budgets/123",
      url: "/api/v1/budgets/123",
      originalUrl: "/api/v1/budgets/123",
      ip: "127.0.0.1",
      get: jest.fn(() => "test-agent"),
      user: { id: "user-1" },
    };

    for (let index = 0; index < 4; index += 1) {
      const { host } = createHost(request);
      await filter.catch(new ForbiddenException("Forbidden"), host);
    }

    expect(securityEvents.record).not.toHaveBeenCalled();

    const { host } = createHost(request);
    await filter.catch(new ForbiddenException("Forbidden"), host);

    expect(securityEvents.record).toHaveBeenCalledWith({
      userId: "user-1",
      type: "repeated_authorization_failure",
      severity: "high",
      metadata: {
        method: "GET",
        route: "/budgets/:id",
        statusCode: 403,
        failureCount: 5,
        windowSeconds: 600,
      },
      req: request,
    });
  });

  it("ignores auth endpoints that already record auth events", async () => {
    const request = {
      method: "POST",
      path: "/api/v1/auth/login",
      url: "/api/v1/auth/login",
      originalUrl: "/api/v1/auth/login",
      ip: "127.0.0.1",
      get: jest.fn(),
    };

    for (let index = 0; index < 5; index += 1) {
      const { host } = createHost(request);
      await filter.catch(new UnauthorizedException("Invalid credentials"), host);
    }

    expect(securityEvents.record).not.toHaveBeenCalled();
  });

  it("counts 401, 403, and 404 only", async () => {
    const request = {
      method: "GET",
      path: "/api/v1/reports/private",
      url: "/api/v1/reports/private",
      originalUrl: "/api/v1/reports/private",
      ip: "127.0.0.1",
      get: jest.fn(),
    };

    for (const exception of [
      new UnauthorizedException(),
      new ForbiddenException(),
      new NotFoundException(),
      new Error("boom"),
      new Error("boom"),
    ]) {
      const { host } = createHost(request);
      await filter.catch(exception, host);
    }

    expect(securityEvents.record).not.toHaveBeenCalled();
  });

  it("preserves the HTTP response when the audit write fails", async () => {
    const request = {
      method: "GET",
      path: "/api/v1/portfolios/private",
      url: "/api/v1/portfolios/private",
      originalUrl: "/api/v1/portfolios/private",
      ip: "127.0.0.1",
      get: jest.fn(),
    };

    for (let index = 0; index < 4; index += 1) {
      await filter.catch(new ForbiddenException(), createHost(request).host);
    }
    securityEvents.record.mockRejectedValueOnce(new Error("database unavailable"));
    const { host, response } = createHost(request);

    await filter.catch(new ForbiddenException("Forbidden"), host);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403, path: request.url }),
    );
  });
});
