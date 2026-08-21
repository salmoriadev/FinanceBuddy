export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const DEFAULT_API_URL = "http://localhost:4000/api/v1";
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? DEFAULT_API_URL : "");

const buildUrl = (path: string) => {
  const trimmed = API_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmed}${normalizedPath}`;
};

let csrfToken: string | null = null;

type AuthSessionHandlers = {
  refreshAccessToken: () => Promise<string | null>;
  onSessionExpired: () => void;
};

let authSessionHandlers: AuthSessionHandlers | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let lastRejectedAccessToken: string | null = null;
let lastRefreshedAccessToken: string | null = null;
let lastRefreshCompletedAt = 0;
let sessionExpiryNotified = false;
const RECENT_REFRESH_WINDOW_MS = 30_000;

export const configureAuthSession = (handlers: AuthSessionHandlers) => {
  authSessionHandlers = handlers;
  refreshInFlight = null;
  lastRejectedAccessToken = null;
  lastRefreshedAccessToken = null;
  lastRefreshCompletedAt = 0;
  sessionExpiryNotified = false;

  return () => {
    if (authSessionHandlers !== handlers) return;
    authSessionHandlers = null;
    refreshInFlight = null;
    lastRejectedAccessToken = null;
    lastRefreshedAccessToken = null;
    lastRefreshCompletedAt = 0;
    sessionExpiryNotified = false;
  };
};

export const invalidateAuthSession = () => {
  lastRejectedAccessToken = null;
  lastRefreshedAccessToken = null;
  lastRefreshCompletedAt = 0;
  sessionExpiryNotified = true;
};

const notifySessionExpired = () => {
  if (sessionExpiryNotified) return;
  sessionExpiryNotified = true;
  authSessionHandlers?.onSessionExpired();
};

const refreshAccessToken = async (rejectedToken: string) => {
  if (!authSessionHandlers) return null;

  if (
    rejectedToken === lastRejectedAccessToken &&
    Date.now() - lastRefreshCompletedAt < RECENT_REFRESH_WINDOW_MS
  ) {
    return lastRefreshedAccessToken;
  }

  if (!refreshInFlight) {
    const handlers = authSessionHandlers;
    sessionExpiryNotified = false;
    lastRejectedAccessToken = rejectedToken;
    lastRefreshedAccessToken = null;
    lastRefreshCompletedAt = 0;
    refreshInFlight = handlers
      .refreshAccessToken()
      .then((token) => {
        if (!token) {
          lastRefreshCompletedAt = Date.now();
          notifySessionExpired();
          return null;
        }
        lastRefreshedAccessToken = token;
        lastRefreshCompletedAt = Date.now();
        return token;
      })
      .catch(() => {
        lastRefreshCompletedAt = Date.now();
        notifySessionExpired();
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
};

const requiresCsrfToken = (method: string, path: string) => {
  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod === "GET" || normalizedMethod === "HEAD") return false;
  return path !== "/auth/csrf";
};

const canRefreshAfterUnauthorized = (path: string, token?: string | null) => {
  if (!token || !authSessionHandlers) return false;
  const requestPath = path.split("?", 1)[0];
  return ![
    "/auth/csrf",
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
  ].includes(requestPath);
};

const ensureCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  const response = await fetch(buildUrl("/auth/csrf"), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    credentials: "include",
  });
  const payload = await response.json();
  if (!response.ok || typeof payload?.csrfToken !== "string") {
    throw new ApiError("Unable to initialize CSRF token", response.status, payload);
  }
  csrfToken = payload.csrfToken;
  return csrfToken;
};

async function requestWithAuthRetry<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    signal?: AbortSignal;
  },
  allowAuthRetry: boolean,
): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      "API_URL not configured. Set VITE_API_URL to your backend URL.",
      500,
    );
  }

  const { method = "GET", body, token, signal } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (requiresCsrfToken(method, path)) {
    headers["X-CSRF-Token"] = await ensureCsrfToken();
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
    signal,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = (() => {
      if (typeof payload === "string") {
        return payload;
      }
      if (payload && typeof payload === "object") {
        const maybeMessage = (payload as { message?: unknown }).message;
        if (Array.isArray(maybeMessage)) {
          return maybeMessage.map((item) => String(item)).join(", ");
        }
        if (typeof maybeMessage === "string") {
          return maybeMessage;
        }
      }
      return "API error";
    })();

    if (response.status === 401 && canRefreshAfterUnauthorized(path, token)) {
      if (allowAuthRetry) {
        const refreshedToken = await refreshAccessToken(token!);
        if (refreshedToken) {
          return requestWithAuthRetry<T>(
            path,
            { ...options, token: refreshedToken },
            false,
          );
        }
      } else {
        notifySessionExpired();
      }
    }

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  return requestWithAuthRetry<T>(path, options, true);
}
