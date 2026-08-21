import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { TtlCache } from "../cache/ttl-cache";
import { SecurityEventService } from "../../modules/security/security-event.service";
import { normalizeSecurityRoute } from "../../modules/security/security-route.util";

const AUTH_AUDITED_ROUTES = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
]);
const AUTH_FAILURE_STATUSES = new Set([
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
  HttpStatus.NOT_FOUND,
]);
const REPEATED_FAILURE_THRESHOLD = 5;
const AUTHORIZATION_FAILURE_CACHE_LIMIT = 10_000;

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly authorizationFailures = new TtlCache<string, number>(
    10 * 60 * 1000,
    AUTHORIZATION_FAILURE_CACHE_LIMIT,
  );

  constructor(private readonly securityEvents: SecurityEventService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse = isHttpException
      ? exception.getResponse()
      : "Internal server error";
    const message = this.normalizeMessage(rawResponse);
    const isProd = process.env.NODE_ENV === "production";
    const includeDetails = !isProd || status < HttpStatus.INTERNAL_SERVER_ERROR;

    await this.auditRepeatedAuthorizationFailure(request, status);

    response.status(status).json({
      statusCode: status,
      path: request.url,
      message,
      details: includeDetails ? rawResponse : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  private async auditRepeatedAuthorizationFailure(
    request: Request,
    status: number,
  ) {
    if (!AUTH_FAILURE_STATUSES.has(status)) return;

    const route = normalizeSecurityRoute(request);
    if (AUTH_AUDITED_ROUTES.has(route)) return;

    const key = `${request.ip || "unknown"}:${request.method}:${route}`;
    const count = (this.authorizationFailures.get(key) ?? 0) + 1;
    this.authorizationFailures.set(key, count);

    if (count !== REPEATED_FAILURE_THRESHOLD) return;

    try {
      await this.securityEvents.record({
        userId: (request as Request & { user?: { id?: string } }).user?.id,
        type: "repeated_authorization_failure",
        severity: "high",
        metadata: {
          method: request.method,
          route,
          statusCode: status,
          failureCount: count,
          windowSeconds: 10 * 60,
        },
        req: request,
      });
    } catch {
      // Audit write failures must not change the HTTP error response.
    }
  }

  private normalizeMessage(response: unknown): string {
    if (typeof response === "string") {
      return response;
    }
    if (response && typeof response === "object") {
      const value = (response as { message?: unknown }).message;
      if (Array.isArray(value)) {
        return value.map((item) => String(item)).join(", ");
      }
      if (typeof value === "string") {
        return value;
      }
    }
    return "Internal server error";
  }
}
