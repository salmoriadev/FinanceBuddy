/**
 * Verifies protected-route behavior for loading, unauthenticated redirection,
 * and authenticated rendering in the router tree.
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

const renderProtectedTree = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="/"
          element={(
            <ProtectedRoute>
              <div>Private Content</div>
            </ProtectedRoute>
          )}
        />
        <Route path="/auth" element={<div>Auth Page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state before auth resolution", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
      accessToken: null,
      signUp: vi.fn(),
      signIn: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      signOut: vi.fn(),
    });

    renderProtectedTree();

    expect(screen.queryByText("Private Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Auth Page")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to /auth", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      accessToken: null,
      signUp: vi.fn(),
      signIn: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      signOut: vi.fn(),
    });

    renderProtectedTree();

    expect(screen.getByText("Auth Page")).toBeInTheDocument();
    expect(screen.queryByText("Private Content")).not.toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: "user-1",
        email: "user@example.com",
      },
      loading: false,
      accessToken: "access-token",
      signUp: vi.fn(),
      signIn: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      signOut: vi.fn(),
    });

    renderProtectedTree();

    expect(screen.getByText("Private Content")).toBeInTheDocument();
    expect(screen.queryByText("Auth Page")).not.toBeInTheDocument();
  });
});
