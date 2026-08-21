import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SecurityAdminGuard } from "../src/modules/security/security-admin.guard";

const ADMIN_USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const createContext = (user?: { id?: string; email?: string }) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe("SecurityAdminGuard", () => {
  let configuredUserIds = `${ADMIN_USER_ID.toUpperCase()}, not-a-uuid`;
  const configService = {
    get: jest.fn((key: string) => {
      if (key === "SECURITY_ADMIN_USER_IDS") return configuredUserIds;
      return undefined;
    }),
  } as unknown as ConfigService;

  const guard = new SecurityAdminGuard(configService);

  beforeEach(() => {
    jest.clearAllMocks();
    configuredUserIds = `${ADMIN_USER_ID.toUpperCase()}, not-a-uuid`;
  });

  it("allows a valid allowlisted user id after normalization", () => {
    expect(guard.canActivate(createContext({ id: ADMIN_USER_ID }))).toBe(true);
  });

  it("blocks missing and non-allowlisted user ids regardless of email", () => {
    expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(
        createContext({ id: OTHER_USER_ID, email: "admin@example.com" }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("fails closed for an empty or invalid allowlist", () => {
    configuredUserIds = "invalid-id";

    expect(() =>
      guard.canActivate(createContext({ id: ADMIN_USER_ID })),
    ).toThrow(ForbiddenException);

    configuredUserIds = "";
    expect(() =>
      guard.canActivate(createContext({ id: ADMIN_USER_ID })),
    ).toThrow(ForbiddenException);
  });
});
