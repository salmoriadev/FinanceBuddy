import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import {
  SecurityEventMetadata,
  SecurityEventRecordInput,
  SecurityEventSeverity,
} from "./security-event.types";
import { SecurityEventsQueryDto } from "./dto/security-events-query.dto";

const SENSITIVE_METADATA_KEYS = new Set([
  "authorization",
  "body",
  "cookie",
  "cookies",
  "password",
  "rawemail",
  "requestbody",
  "token",
  "accesstoken",
  "refreshtoken",
]);

@Injectable()
export class SecurityEventService {
  constructor(private readonly prisma: PrismaService) {}

  record(data: SecurityEventRecordInput) {
    const userAgent = data.userAgent ?? data.req?.get("user-agent") ?? null;
    const ipAddress = data.ipAddress ?? data.req?.ip ?? null;

    return this.prisma.securityEvent.create({
      data: {
        userId: data.userId ?? null,
        type: data.type,
        severity: data.severity,
        metadata: this.sanitizeMetadata(data.metadata),
        userAgent,
        ipAddress,
      },
    });
  }

  async list(query: SecurityEventsQueryDto) {
    const limit = Math.min(query.limit ?? 50, 100);
    const createdAt: Prisma.DateTimeFilter<"SecurityEvent"> = {
      gte: query.from ? new Date(query.from) : undefined,
      lte: query.to ? new Date(query.to) : undefined,
    };
    const where: Prisma.SecurityEventWhereInput = {
      type: query.type,
      severity: query.severity,
      userId: query.userId,
      createdAt: createdAt.gte || createdAt.lte ? createdAt : undefined,
    };

    return this.prisma.securityEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        userId: true,
        type: true,
        severity: true,
        metadata: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
      },
    });
  }

  private sanitizeMetadata(metadata?: SecurityEventMetadata) {
    if (!metadata) return undefined;
    return this.sanitizeValue(metadata) as Prisma.InputJsonObject;
  }

  private sanitizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([key]) => !this.isSensitiveKey(key))
          .map(([key, item]) => [key, this.sanitizeValue(item)]),
      );
    }

    if (typeof value === "string" && value.includes("@")) {
      return "[redacted]";
    }

    return value;
  }

  private isSensitiveKey(key: string) {
    return SENSITIVE_METADATA_KEYS.has(key.toLowerCase());
  }
}

export { SecurityEventSeverity };
