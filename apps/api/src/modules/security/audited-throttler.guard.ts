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
import { TtlCache } from "../../common/cache/ttl-cache";
import { SecurityEventService } from "./security-event.service";
import { normalizeSecurityRoute } from "./security-route.util";

const AUDITED_BLOCK_CACHE_LIMIT = 10_000;

@Injectable()
export class AuditedThrottlerGuard extends ThrottlerGuard {
  private readonly auditedBlocks = new TtlCache<string, true>(
    60_000,
    AUDITED_BLOCK_CACHE_LIMIT,
  );

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
    const route = normalizeSecurityRoute(request);
    // The base guard key includes controller, handler, throttler name, and
    // tracker. Keep tracker and route explicit so the dedupe boundary remains
    // stable if upstream key generation changes.
    const auditKey = `${throttlerLimitDetail.tracker}:${throttlerLimitDetail.key}:${route}`;

    if (!this.auditedBlocks.get(auditKey)) {
      const blockWindowMs =
        Math.max(
          1,
          throttlerLimitDetail.timeToBlockExpire ||
            Math.ceil(throttlerLimitDetail.ttl / 1000),
        ) * 1000;
      this.auditedBlocks.set(auditKey, true, blockWindowMs);
      this.enqueueAuditWrite(request, route, throttlerLimitDetail);
    }

    await super.throwThrottlingException(context, throttlerLimitDetail);
  }

  private enqueueAuditWrite(
    request: Request & { user?: { id?: string } },
    route: string,
    detail: ThrottlerLimitDetail,
  ) {
    void Promise.resolve()
      .then(() =>
        this.securityEvents.record({
          userId: request.user?.id,
          type: "rate_limit_blocked",
          severity: "medium",
          metadata: {
            method: request.method,
            route,
            limit: detail.limit,
            ttl: detail.ttl,
            totalHits: detail.totalHits,
            timeToBlockExpire: detail.timeToBlockExpire,
          },
          req: request,
        }),
      )
      .catch(() => undefined);
  }
}
