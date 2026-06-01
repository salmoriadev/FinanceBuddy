/**
 * Ensures CSRF protection guard enforces request header and origin validation
 * rules for cookie-authenticated endpoints.
 */
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CsrfProtectionGuard } from "../src/common/guards/csrf-protection.guard";

const CSRF_TOKEN = "a".repeat(64);

const createContext = (
  headers: Record<string, string | undefined>,
  cookies: Record<string, string | undefined> = {},
) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ cookies, headers }),
    }),
  }) as unknown as ExecutionContext;

describe("CsrfProtectionGuard", () => {
  const configServiceMock = {
    get: jest.fn(),
  } as unknown as ConfigService;

  const guard = new CsrfProtectionGuard(configServiceMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects requests without X-Requested-With header", () => {
    configServiceMock.get = jest.fn((key: string) => {
      if (key === "NODE_ENV") return "development";
      return undefined;
    });

    expect(() =>
      guard.canActivate(createContext({ origin: "http://localhost:8080" })),
    ).toThrow(ForbiddenException);
  });

  it("rejects requests without matching CSRF token", () => {
    configServiceMock.get = jest.fn((key: string) => {
      if (key === "NODE_ENV") return "development";
      return undefined;
    });

    expect(() =>
      guard.canActivate(
        createContext({
          "x-requested-with": "XMLHttpRequest",
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("allows requests with matching CSRF token in development", () => {
    configServiceMock.get = jest.fn((key: string) => {
      if (key === "NODE_ENV") return "development";
      return undefined;
    });

    const allowed = guard.canActivate(
      createContext(
        {
          "x-requested-with": "XMLHttpRequest",
          "x-csrf-token": CSRF_TOKEN,
        },
        { csrf_token: CSRF_TOKEN },
      ),
    );

    expect(allowed).toBe(true);
  });

  it("rejects disallowed origin in production", () => {
    configServiceMock.get = jest.fn((key: string) => {
      if (key === "NODE_ENV") return "production";
      if (key === "CORS_ORIGIN") return "http://localhost:8080";
      return undefined;
    });

    expect(() =>
      guard.canActivate(
        createContext(
          {
            "x-requested-with": "XMLHttpRequest",
            "x-csrf-token": CSRF_TOKEN,
            origin: "http://evil.example",
          },
          { csrf_token: CSRF_TOKEN },
        ),
      ),
    ).toThrow(ForbiddenException);
  });

  it("allows configured origin in production", () => {
    configServiceMock.get = jest.fn((key: string) => {
      if (key === "NODE_ENV") return "production";
      if (key === "CORS_ORIGIN") return "http://localhost:8080";
      return undefined;
    });

    const allowed = guard.canActivate(
      createContext(
        {
          "x-requested-with": "XMLHttpRequest",
          "x-csrf-token": CSRF_TOKEN,
          origin: "http://localhost:8080",
        },
        { csrf_token: CSRF_TOKEN },
      ),
    );

    expect(allowed).toBe(true);
  });

  it("rejects production requests when CORS_ORIGIN is not configured", () => {
    configServiceMock.get = jest.fn((key: string) => {
      if (key === "NODE_ENV") return "production";
      if (key === "CORS_ORIGIN") return "";
      return undefined;
    });

    expect(() =>
      guard.canActivate(
        createContext(
          {
            "x-requested-with": "XMLHttpRequest",
            "x-csrf-token": CSRF_TOKEN,
            origin: "http://localhost:8080",
          },
          { csrf_token: CSRF_TOKEN },
        ),
      ),
    ).toThrow(ForbiddenException);
  });
});
