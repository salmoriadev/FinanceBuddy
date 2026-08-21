import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { TtlCache } from "./ttl-cache";

const REPORT_VERSION_TTL_MS = 24 * 60 * 60 * 1_000;
const REPORT_VERSION_MAX_USERS = 10_000;

/**
 * Keeps a bounded, per-user version token for report cache keys.
 *
 * Mutating services advance the token after a successful write. Reports then
 * stop observing entries computed before that write without needing direct
 * dependencies between feature modules.
 */
@Injectable()
export class ReportsCacheInvalidationService {
  private readonly versions = new TtlCache<string, string>(
    REPORT_VERSION_TTL_MS,
    REPORT_VERSION_MAX_USERS,
  );

  getVersion(userId: string) {
    const existing = this.versions.get(userId);
    if (existing) {
      return existing;
    }

    return this.assignNewVersion(userId);
  }

  invalidate(userId: string) {
    return this.assignNewVersion(userId);
  }

  private assignNewVersion(userId: string) {
    const version = randomUUID();
    this.versions.set(userId, version);
    return version;
  }
}
