import { Request } from "express";

const API_PREFIX = /^\/api\/v\d+\b/;
const UUID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeSecurityRoute(req: Request): string {
  const routePath = getRouteTemplate(req);
  const rawPath =
    routePath || req.path || req.url?.split("?")[0] || req.originalUrl || "/";
  const withoutQuery = rawPath.split("?")[0] || "/";
  const withoutPrefix = withoutQuery.replace(API_PREFIX, "") || "/";

  return withoutPrefix
    .split("/")
    .map((segment) => normalizePathSegment(segment))
    .join("/")
    .replace(/\/+/g, "/");
}

function getRouteTemplate(req: Request) {
  const routePath = req.route?.path;
  if (!routePath || typeof routePath !== "string") return null;
  const baseUrl = req.baseUrl || "";
  return `${baseUrl}${routePath}`;
}

function normalizePathSegment(segment: string) {
  if (!segment) return segment;
  if (UUID_SEGMENT.test(segment)) return ":id";
  if (/^\d+$/.test(segment)) return ":id";
  return segment;
}
