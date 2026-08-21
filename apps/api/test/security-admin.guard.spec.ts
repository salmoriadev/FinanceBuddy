import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SecurityAdminGuard } from "../src/modules/security/security-admin.guard";

const createContext = (user?: { email?: string }) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe("SecurityAdminGuard", () => {
  const configService = {
    get: jest.fn((key: string) => {
      if (key === "SECURITY_ADMIN_EMAILS") {
        return "Admin@Example.com, audit@example.com";
      }
      return undefined;
    }),
  } as unknown as ConfigService;

  const guard = new SecurityAdminGuard(configService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows allowlisted emails case-insensitively", () => {
    expect(
      guard.canActivate(createContext({ email: "admin@example.com" })),
    ).toBe(true);
  });

  it("blocks missing and non-allowlisted emails", () => {
    expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(createContext({ email: "user@example.com" })),
    ).toThrow(ForbiddenException);
  });
});
