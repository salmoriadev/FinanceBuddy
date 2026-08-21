import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

function SessionProbe() {
  const { accessToken, loading, user } = useAuth();
  const [requestResult, setRequestResult] = useState("idle");

  const requestProtectedResource = async () => {
    try {
      await apiRequest("/protected-resource", { token: accessToken });
      setRequestResult("success");
    } catch {
      setRequestResult("failed");
    }
  };

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.email ?? "guest"}</span>
      <span data-testid="token">{accessToken ?? "none"}</span>
      <span data-testid="result">{requestResult}</span>
      <button type="button" onClick={() => void requestProtectedResource()}>
        Request
      </button>
    </div>
  );
}

describe("AuthProvider continuous sessions", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("updates AuthContext when a protected request refreshes an expired token", async () => {
    let refreshCount = 0;
    const fetchMock = vi.fn((input: string | URL | Request, options?: RequestInit) => {
      const path = new URL(String(input)).pathname.replace("/api/v1", "");
      const authorization = (options?.headers as Record<string, string>)
        ?.Authorization;

      if (path === "/auth/csrf") {
        return Promise.resolve(jsonResponse({ csrfToken: "csrf-token" }));
      }
      if (path === "/auth/refresh") {
        refreshCount += 1;
        return Promise.resolve(
          jsonResponse({ accessToken: `access-token-${refreshCount}` }),
        );
      }
      if (path === "/auth/me") {
        return Promise.resolve(
          jsonResponse({ user: { id: "user-1", email: "user@example.com" } }),
        );
      }
      if (path === "/protected-resource") {
        return Promise.resolve(
          authorization === "Bearer access-token-2"
            ? jsonResponse({ ok: true })
            : jsonResponse({ message: "Unauthorized" }, 401),
        );
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("token")).toHaveTextContent("access-token-1");

    fireEvent.click(screen.getByRole("button", { name: "Request" }));

    await waitFor(() => expect(screen.getByTestId("result")).toHaveTextContent("success"));
    expect(screen.getByTestId("token")).toHaveTextContent("access-token-2");
    expect(screen.getByTestId("user")).toHaveTextContent("user@example.com");
    expect(refreshCount).toBe(2);
  });

  it("clears AuthContext when refresh rotation fails", async () => {
    let refreshCount = 0;
    const fetchMock = vi.fn((input: string | URL | Request, options?: RequestInit) => {
      const path = new URL(String(input)).pathname.replace("/api/v1", "");
      const authorization = (options?.headers as Record<string, string>)
        ?.Authorization;

      if (path === "/auth/csrf") {
        return Promise.resolve(jsonResponse({ csrfToken: "csrf-token" }));
      }
      if (path === "/auth/refresh") {
        refreshCount += 1;
        return Promise.resolve(
          refreshCount === 1
            ? jsonResponse({ accessToken: "access-token-1" })
            : jsonResponse({ message: "Refresh expired" }, 401),
        );
      }
      if (path === "/auth/me") {
        return Promise.resolve(
          jsonResponse({ user: { id: "user-1", email: "user@example.com" } }),
        );
      }
      if (path === "/protected-resource") {
        expect(authorization).toBe("Bearer access-token-1");
        return Promise.resolve(jsonResponse({ message: "Unauthorized" }, 401));
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    fireEvent.click(screen.getByRole("button", { name: "Request" }));

    await waitFor(() => expect(screen.getByTestId("result")).toHaveTextContent("failed"));
    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(screen.getByTestId("user")).toHaveTextContent("guest");
    expect(refreshCount).toBe(2);
  });
});
