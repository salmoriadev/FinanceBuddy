/**
 * Applies lightweight CSRF defenses for cookie-authenticated endpoints by
 * requiring an AJAX-only header and validating request origin in production.
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

const extractOrigin = (value?: string) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
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
      return true;
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
