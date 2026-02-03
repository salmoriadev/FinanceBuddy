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

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    signal?: AbortSignal;
  } = {},
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
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
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
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
