/**
 * Ensures API client requests include security-related headers and auth token
 * forwarding expected by backend guards and protected endpoints.
 */
import { vi } from "vitest";

describe("apiRequest", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends X-Requested-With header for CSRF-protected routes", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:4000/api/v1");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: "csrf-token" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { apiRequest } = await import("@/lib/api");
    await apiRequest<{ ok: boolean }>("/auth/refresh", {
      method: "POST",
    });

    const [, options] = fetchMock.mock.calls[1] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;

    expect(headers.Accept).toBe("application/json");
    expect(headers["X-Requested-With"]).toBe("XMLHttpRequest");
    expect(headers["X-CSRF-Token"]).toBe("csrf-token");
  });

  it("forwards authorization bearer token when provided", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:4000/api/v1");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { apiRequest } = await import("@/lib/api");
    await apiRequest<{ ok: boolean }>("/secure", {
      token: "access-token",
    });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;

    expect(headers.Authorization).toBe("Bearer access-token");
  });
});
