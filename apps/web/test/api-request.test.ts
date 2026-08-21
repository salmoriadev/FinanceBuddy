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

  it("serializes session refresh with one module flight inside a Web Lock", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:4000/api/v1");

    let finishRefresh: ((token: string) => void) | undefined;
    const refreshResult = new Promise<string>((resolve) => {
      finishRefresh = resolve;
    });
    const refreshAccessToken = vi.fn(() => refreshResult);
    const lockRequest = vi.fn(
      async (
        _name: string,
        _options: LockOptions,
        operation: () => Promise<string | null>,
      ) => operation(),
    );
    vi.stubGlobal("navigator", { locks: { request: lockRequest } });

    const {
      configureAuthSession,
      requestAuthSessionRefresh,
    } = await import("@/lib/api");
    configureAuthSession({
      refreshAccessToken,
      onSessionExpired: vi.fn(),
    });

    const firstRefresh = requestAuthSessionRefresh();
    const secondRefresh = requestAuthSessionRefresh();

    await vi.waitFor(() => expect(refreshAccessToken).toHaveBeenCalledTimes(1));
    expect(lockRequest).toHaveBeenCalledTimes(1);
    expect(lockRequest).toHaveBeenCalledWith(
      "financebuddy:refresh-session",
      { mode: "exclusive" },
      expect.any(Function),
    );

    finishRefresh?.("refreshed-token");
    await expect(Promise.all([firstRefresh, secondRefresh])).resolves.toEqual([
      "refreshed-token",
      "refreshed-token",
    ]);
  });

  it("refreshes concurrent unauthorized requests once and retries each safely", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:4000/api/v1");

    let finishRefresh: ((token: string) => void) | undefined;
    const refreshResult = new Promise<string>((resolve) => {
      finishRefresh = resolve;
    });
    const refreshAccessToken = vi.fn(() => refreshResult);
    const onSessionExpired = vi.fn();
    const fetchMock = vi.fn((_url: string, options?: RequestInit) => {
      const authorization = (options?.headers as Record<string, string>)
        ?.Authorization;
      if (authorization === "Bearer expired-token") {
        return Promise.resolve(
          new Response(JSON.stringify({ message: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          }),
        );
      }
      if (authorization === "Bearer refreshed-token") {
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      }
      throw new Error(`Unexpected authorization: ${authorization}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { apiRequest, configureAuthSession } = await import("@/lib/api");
    configureAuthSession({ refreshAccessToken, onSessionExpired });

    const firstRequest = apiRequest<{ ok: boolean }>("/first", {
      token: "expired-token",
    });
    const secondRequest = apiRequest<{ ok: boolean }>("/second", {
      token: "expired-token",
    });

    await vi.waitFor(() => expect(refreshAccessToken).toHaveBeenCalledTimes(1));
    finishRefresh?.("refreshed-token");

    await expect(Promise.all([firstRequest, secondRequest])).resolves.toEqual([
      { ok: true },
      { ok: true },
    ]);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("clears the session once when a shared refresh fails", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:4000/api/v1");

    const refreshAccessToken = vi
      .fn<() => Promise<string | null>>()
      .mockRejectedValue(new Error("refresh rejected"));
    const onSessionExpired = vi.fn();
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { ApiError, apiRequest, configureAuthSession } = await import(
      "@/lib/api"
    );
    configureAuthSession({ refreshAccessToken, onSessionExpired });

    const results = await Promise.allSettled([
      apiRequest("/first", { token: "expired-token" }),
      apiRequest("/second", { token: "expired-token" }),
    ]);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(result.status).toBe("rejected");
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(ApiError);
      }
    }

    await expect(
      apiRequest("/late-request", { token: "expired-token" }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("retries only once and expires the session when the new token is rejected", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:4000/api/v1");

    const refreshAccessToken = vi.fn().mockResolvedValue("invalid-new-token");
    const onSessionExpired = vi.fn();
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { apiRequest, configureAuthSession } = await import("@/lib/api");
    configureAuthSession({ refreshAccessToken, onSessionExpired });

    await expect(
      apiRequest("/protected", { token: "expired-token" }),
    ).rejects.toMatchObject({ status: 401 });

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("never recurses through login or refresh endpoints", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:4000/api/v1");

    const refreshAccessToken = vi.fn();
    const onSessionExpired = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { apiRequest, configureAuthSession } = await import("@/lib/api");
    configureAuthSession({ refreshAccessToken, onSessionExpired });

    await expect(
      apiRequest("/auth/login", { token: "expired-token" }),
    ).rejects.toMatchObject({ status: 401 });

    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(onSessionExpired).not.toHaveBeenCalled();
  });
});
