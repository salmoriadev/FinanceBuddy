/**
 * Verifies JWT auth guard token validation, issuer/audience checks, and user
 * extraction behavior for protected API requests.
 */
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jwt from "jsonwebtoken";
import { JwtAuthGuard } from "../src/common/guards/jwt-auth.guard";

type MutableRequest = {
  headers: Record<string, string | undefined>;
  user?: { id: string; email?: string };
};

const createContext = (request: MutableRequest) =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

describe("JwtAuthGuard", () => {
  const configServiceMock = {
    get: jest.fn((key: string) => {
      if (key === "AUTH_JWT_SECRET") return "test-secret";
      if (key === "AUTH_JWT_AUD") return "financebuddy";
      if (key === "AUTH_JWT_ISSUER") return "financebuddy";
      return undefined;
    }),
  } as unknown as ConfigService;

  const guard = new JwtAuthGuard(configServiceMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects requests without bearer token", () => {
    const request: MutableRequest = { headers: {} };

    expect(() => guard.canActivate(createContext(request))).toThrow(
      UnauthorizedException,
    );
  });

  it("rejects malformed or invalid bearer token", () => {
    const request: MutableRequest = {
      headers: { authorization: "Bearer invalid-token" },
    };

    expect(() => guard.canActivate(createContext(request))).toThrow(
      UnauthorizedException,
    );
  });

  it("rejects token with invalid audience", () => {
    const token = jwt.sign({ sub: "user-1", email: "user@example.com" }, "test-secret", {
      algorithm: "HS256",
      audience: "other-audience",
      issuer: "financebuddy",
    });
    const request: MutableRequest = {
      headers: { authorization: `Bearer ${token}` },
    };

    expect(() => guard.canActivate(createContext(request))).toThrow(
      UnauthorizedException,
    );
  });

  it("accepts valid token and attaches request user", () => {
    const token = jwt.sign({ sub: "user-1", email: "user@example.com" }, "test-secret", {
      algorithm: "HS256",
      audience: "financebuddy",
      issuer: "financebuddy",
    });
    const request: MutableRequest = {
      headers: { authorization: `Bearer ${token}` },
    };

    const allowed = guard.canActivate(createContext(request));

    expect(allowed).toBe(true);
    expect(request.user).toEqual({
      id: "user-1",
      email: "user@example.com",
    });
  });
});
