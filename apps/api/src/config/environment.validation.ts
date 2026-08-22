type Environment = Record<string, unknown>;

const NODE_ENV_VALUES = new Set(["development", "test", "production"]);
const JWT_SECRET_MIN_LENGTH = 48;
const MAX_REQUEST_BODY_BYTES = 1024 * 1024;
const PLACEHOLDER_PATTERN =
  /(change[-_ ]?me|replace[-_ ]?with|example|optional[-_ ]?secret|your[-_ ]?(secret|password)|<[^>]+>)/i;

const valueOf = (environment: Environment, key: string) => {
  const value = environment[key];
  if (value === undefined || value === null) return undefined;
  const stringValue = String(value);
  if (stringValue !== stringValue.trim()) {
    throw new Error(`${key} must not contain surrounding whitespace`);
  }
  return stringValue;
};

const requireValue = (environment: Environment, key: string) => {
  const value = valueOf(environment, key);
  if (!value) throw new Error(`${key} must be configured`);
  return value;
};

const assertInteger = (
  environment: Environment,
  key: string,
  min: number,
  max: number,
  required: boolean,
) => {
  const value = valueOf(environment, key);
  if (!value) {
    if (required) throw new Error(`${key} must be configured`);
    return;
  }
  if (!/^\d+$/.test(value)) {
    throw new Error(`${key} must be an integer between ${min} and ${max}`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${key} must be an integer between ${min} and ${max}`);
  }
};

const assertStrongSecret = (value: string, key: string, minLength: number) => {
  const characterClasses = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(
    (pattern) => pattern.test(value),
  ).length;
  const isHexEncoded = /^[a-f0-9]+$/i.test(value);
  const uniqueCharacters = new Set(value).size;
  if (
    value.length < minLength ||
    PLACEHOLDER_PATTERN.test(value) ||
    (!isHexEncoded && characterClasses < 3) ||
    uniqueCharacters < 12
  ) {
    throw new Error(`${key} must be a strong, unique secret`);
  }
};

const assertDatabaseUrl = (value: string, production: boolean) => {
  let databaseUrl: URL;
  try {
    databaseUrl = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL");
  }
  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !databaseUrl.hostname ||
    !databaseUrl.username ||
    !databaseUrl.password
  ) {
    throw new Error("DATABASE_URL must include PostgreSQL credentials and host");
  }
  if (
    production &&
    (PLACEHOLDER_PATTERN.test(value) ||
      databaseUrl.password.toLowerCase() === "postgres")
  ) {
    throw new Error("DATABASE_URL must not use example production credentials");
  }
};

const assertCorsOrigins = (value: string) => {
  const origins = value.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (origins.length === 0) throw new Error("CORS_ORIGIN must be configured");
  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error("CORS_ORIGIN must contain valid HTTPS origins");
    }
    if (
      parsed.protocol !== "https:" ||
      parsed.origin !== origin ||
      parsed.username ||
      parsed.password ||
      origin.includes("*")
    ) {
      throw new Error("CORS_ORIGIN must contain exact HTTPS origins");
    }
  }
};

const assertRequestBodyLimit = (value: string) => {
  const match = /^(\d+)(b|kb|mb)$/i.exec(value);
  if (!match) {
    throw new Error("REQUEST_BODY_LIMIT must use b, kb, or mb units");
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = unit === "mb" ? 1024 * 1024 : unit === "kb" ? 1024 : 1;
  const bytes = amount * multiplier;
  if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > MAX_REQUEST_BODY_BYTES) {
    throw new Error("REQUEST_BODY_LIMIT must be between 1b and 1mb");
  }
};

const assertCookieDomain = (value: string | undefined) => {
  if (!value) return;
  if (!/^\.?[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(value)) {
    throw new Error("COOKIE_DOMAIN must be a hostname without scheme or port");
  }
};

export const validateEnvironment = (environment: Environment): Environment => {
  const nodeEnv = requireValue(environment, "NODE_ENV");
  if (!NODE_ENV_VALUES.has(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production");
  }
  const production = nodeEnv === "production";

  assertDatabaseUrl(requireValue(environment, "DATABASE_URL"), production);
  const jwtSecret = requireValue(environment, "AUTH_JWT_SECRET");
  if (production) {
    assertStrongSecret(jwtSecret, "AUTH_JWT_SECRET", JWT_SECRET_MIN_LENGTH);

    for (const key of ["AUTH_JWT_ISSUER", "AUTH_JWT_AUD"] as const) {
      const identifier = requireValue(environment, key);
      if (
        identifier.length > 200 ||
        /\s/.test(identifier) ||
        PLACEHOLDER_PATTERN.test(identifier)
      ) {
        throw new Error(`${key} must be an explicit JWT identifier`);
      }
    }

    const pepper = valueOf(environment, "PASSWORD_PEPPER");
    if (pepper) {
      assertStrongSecret(pepper, "PASSWORD_PEPPER", 32);
      if (pepper === jwtSecret) {
        throw new Error("PASSWORD_PEPPER must be independent from AUTH_JWT_SECRET");
      }
    }

    assertCorsOrigins(requireValue(environment, "CORS_ORIGIN"));
    const sameSite = requireValue(environment, "COOKIE_SAMESITE");
    if (!["lax", "strict", "none"].includes(sameSite)) {
      throw new Error("COOKIE_SAMESITE must be lax, strict, or none");
    }
    const trustProxy = requireValue(environment, "TRUST_PROXY");
    if (!["true", "false"].includes(trustProxy)) {
      throw new Error("TRUST_PROXY must explicitly be true or false");
    }
    if (requireValue(environment, "MARKET_DATA_ENABLE_MOCK_FALLBACK") !== "false") {
      throw new Error(
        "MARKET_DATA_ENABLE_MOCK_FALLBACK must be false in production",
      );
    }
  }

  assertCookieDomain(valueOf(environment, "COOKIE_DOMAIN"));
  assertInteger(environment, "PORT", 1, 65_535, false);
  assertInteger(environment, "ACCESS_TOKEN_TTL_MINUTES", 1, 60, production);
  assertInteger(environment, "REFRESH_TOKEN_TTL_DAYS", 1, 90, production);
  assertInteger(environment, "ARGON2_MEMORY_KIB", 19_456, 1_048_576, false);
  assertInteger(environment, "ARGON2_TIME_COST", 2, 10, false);
  assertInteger(environment, "ARGON2_PARALLELISM", 1, 16, false);

  const bodyLimit = valueOf(environment, "REQUEST_BODY_LIMIT");
  if (bodyLimit) assertRequestBodyLimit(bodyLimit);
  else if (production) throw new Error("REQUEST_BODY_LIMIT must be configured");

  return environment;
};
