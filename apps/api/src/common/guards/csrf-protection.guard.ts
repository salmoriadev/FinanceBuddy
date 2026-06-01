/**
 * Applies CSRF defenses for cookie-authenticated endpoints by requiring an
 * AJAX-only header, a double-submit CSRF token, and production origin checks.
 */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const CSRF_HEADER_NAME = "x-requested-with";
const CSRF_HEADER_VALUE = "XMLHttpRequest";
const CSRF_TOKEN_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_COOKIE_NAME = "csrf_token";

const extractOrigin = (value?: string) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const extractCookie = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = cookie.slice(0, separatorIndex);
    if (key !== name) continue;
    return decodeURIComponent(cookie.slice(separatorIndex + 1));
  }
  return null;
};

@Injectable()
export class CsrfProtectionGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const requestedWith = request.headers?.[CSRF_HEADER_NAME];
    if (requestedWith !== CSRF_HEADER_VALUE) {
      throw new ForbiddenException("Missing CSRF request header");
    }

    const csrfHeader = request.headers?.[CSRF_TOKEN_HEADER_NAME];
    const csrfCookie =
      request.cookies?.[CSRF_TOKEN_COOKIE_NAME] ??
      extractCookie(request.headers?.cookie as string | undefined, CSRF_TOKEN_COOKIE_NAME);
    if (
      typeof csrfHeader !== "string" ||
      typeof csrfCookie !== "string" ||
      csrfHeader.length < 32 ||
      csrfHeader !== csrfCookie
    ) {
      throw new ForbiddenException("CSRF token invalid");
    }

    const isProd = this.configService.get<string>("NODE_ENV") === "production";
    if (!isProd) {
      return true;
    }

    const corsOrigins = (
      this.configService.get<string>("CORS_ORIGIN") ?? ""
    )
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (corsOrigins.length === 0) {
      throw new ForbiddenException("CORS origin is not configured");
    }

    const origin = extractOrigin(request.headers?.origin as string | undefined);
    const refererOrigin = extractOrigin(
      request.headers?.referer as string | undefined,
    );
    const requestOrigin = origin ?? refererOrigin;

    if (!requestOrigin || !corsOrigins.includes(requestOrigin)) {
      throw new ForbiddenException("Request origin is not allowed");
    }

    return true;
  }
}
