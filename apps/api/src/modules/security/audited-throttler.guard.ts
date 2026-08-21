import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from "@nestjs/throttler";
import { ThrottlerLimitDetail } from "@nestjs/throttler/dist/throttler.guard.interface";
import { Request } from "express";
import { SecurityEventService } from "./security-event.service";
import { normalizeSecurityRoute } from "./security-route.util";

@Injectable()
export class AuditedThrottlerGuard extends ThrottlerGuard {
  constructor(
    private readonly securityEvents: SecurityEventService,
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { id?: string } }>();

    try {
      await this.securityEvents.record({
        userId: request.user?.id,
        type: "rate_limit_blocked",
        severity: "medium",
        metadata: {
          method: request.method,
          route: normalizeSecurityRoute(request),
          limit: throttlerLimitDetail.limit,
          ttl: throttlerLimitDetail.ttl,
          totalHits: throttlerLimitDetail.totalHits,
          timeToBlockExpire: throttlerLimitDetail.timeToBlockExpire,
        },
        req: request,
      });
    } catch {
      // Audit write failures must not change rate-limit enforcement.
    }

    await super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
