import { Request } from "express";

export type SecurityEventSeverity = "info" | "medium" | "high" | "critical";

export interface SecurityEventMetadata {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | SecurityEventMetadata
    | SecurityEventMetadata[];
}

export interface SecurityEventRecordInput {
  userId?: string | null;
  type: string;
  severity: SecurityEventSeverity;
  metadata?: SecurityEventMetadata;
  req?: Request;
  userAgent?: string | null;
  ipAddress?: string | null;
}
