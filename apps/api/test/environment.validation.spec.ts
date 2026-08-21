import { validateEnvironment } from "../src/config/environment.validation";

const strongSecret =
  "M9v!Q2x#L7p$T4z@N8c%R5w&K1y*H6s?D3f+J0u=V9b!G2m#P7q$X4a@";

const productionEnvironment = (): Record<string, string> => ({
  NODE_ENV: "production",
  DATABASE_URL:
    "postgresql://financebuddy:N0tDefault%21Password@db.internal:5432/financebuddy",
  AUTH_JWT_SECRET: strongSecret,
  AUTH_JWT_ISSUER: "financebuddy-api",
  AUTH_JWT_AUD: "financebuddy-web",
  ACCESS_TOKEN_TTL_MINUTES: "15",
  REFRESH_TOKEN_TTL_DAYS: "30",
  ARGON2_MEMORY_KIB: "19456",
  ARGON2_TIME_COST: "2",
  ARGON2_PARALLELISM: "1",
  CORS_ORIGIN: "https://app.financebuddy.dev",
  COOKIE_SAMESITE: "lax",
  TRUST_PROXY: "true",
  PORT: "4000",
  REQUEST_BODY_LIMIT: "100kb",
  MARKET_DATA_ENABLE_MOCK_FALLBACK: "false",
});

describe("production environment validation", () => {
  it("accepts an explicit hardened production configuration", () => {
    const environment = productionEnvironment();

    expect(validateEnvironment(environment)).toBe(environment);
  });

  it.each([
    ["public JWT placeholder", { AUTH_JWT_SECRET: "change-me" }, "AUTH_JWT_SECRET"],
    ["missing issuer", { AUTH_JWT_ISSUER: "" }, "AUTH_JWT_ISSUER"],
    ["missing audience", { AUTH_JWT_AUD: "" }, "AUTH_JWT_AUD"],
    ["default database password", {
      DATABASE_URL: "postgresql://postgres:postgres@db.internal:5432/postgres",
    }, "DATABASE_URL"],
    ["non-HTTPS CORS", { CORS_ORIGIN: "http://app.financebuddy.dev" }, "CORS_ORIGIN"],
    ["ambiguous cookie policy", { COOKIE_SAMESITE: "" }, "COOKIE_SAMESITE"],
    ["ambiguous proxy trust", { TRUST_PROXY: "yes" }, "TRUST_PROXY"],
    ["unbounded access TTL", { ACCESS_TOKEN_TTL_MINUTES: "1440" }, "ACCESS_TOKEN_TTL_MINUTES"],
    ["excessive body limit", { REQUEST_BODY_LIMIT: "10mb" }, "REQUEST_BODY_LIMIT"],
    ["mock financial data", { MARKET_DATA_ENABLE_MOCK_FALLBACK: "true" }, "MARKET_DATA_ENABLE_MOCK_FALLBACK"],
  ])("rejects %s", (_label, override, expectedKey) => {
    expect(() =>
      validateEnvironment({ ...productionEnvironment(), ...override }),
    ).toThrow(expectedKey as string);
  });

  it("requires an explicit runtime environment", () => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: productionEnvironment().DATABASE_URL,
        AUTH_JWT_SECRET: "local-secret",
      }),
    ).toThrow("NODE_ENV");
  });
});
