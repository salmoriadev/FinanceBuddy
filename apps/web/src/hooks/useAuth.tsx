/* eslint-disable react-refresh/only-export-components */
import {
  useCallback,
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  ReactNode,
} from "react";
import {
  apiRequest,
  ApiError,
  configureAuthSession,
  invalidateAuthSession,
  requestAuthSessionRefresh,
} from "@/lib/api";

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  locale?: string | null;
  currency?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  updateProfile: (data: {
    name?: string | null;
    locale?: string;
    currency?: string;
  }) => Promise<{ error: Error | null }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionVersion = useRef(0);
  const refreshAllowed = useRef(true);

  const persistToken = useCallback((token: string | null) => {
    setAccessToken(token);
  }, []);

  const clearSession = useCallback(() => {
    sessionVersion.current += 1;
    refreshAllowed.current = false;
    invalidateAuthSession();
    persistToken(null);
    setUser(null);
  }, [persistToken]);

  const fetchMe = useCallback(async (token: string) => {
    const data = await apiRequest<{ user: AuthUser }>("/auth/me", {
      token,
    });
    setUser(data.user);
  }, []);

  const performAccessTokenRefresh = useCallback(async () => {
    if (!refreshAllowed.current) return null;
    const requestVersion = sessionVersion.current;
    const data = await apiRequest<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
    });
    if (requestVersion !== sessionVersion.current) return null;
    if (!data?.accessToken) return null;

    persistToken(data.accessToken);
    return data.accessToken;
  }, [persistToken]);

  const refreshSession = useCallback(async () => {
    try {
      const token = await requestAuthSessionRefresh();
      if (token) {
        await fetchMe(token);
        return true;
      }
      return false;
    } catch {
      clearSession();
      return false;
    }
  }, [clearSession, fetchMe]);

  useEffect(
    () =>
      configureAuthSession({
        refreshAccessToken: performAccessTokenRefresh,
        onSessionExpired: clearSession,
      }),
    [clearSession, performAccessTokenRefresh],
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const refreshed = await refreshSession();
        if (!refreshed && isMounted) {
          clearSession();
        }
      } catch {
        if (isMounted) {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [clearSession, refreshSession]);

  const signUp = async (email: string, password: string) => {
    try {
      sessionVersion.current += 1;
      const data = await apiRequest<{ user: AuthUser; accessToken: string }>(
        "/auth/register",
        {
          method: "POST",
          body: { email, password },
        },
      );
      refreshAllowed.current = true;
      persistToken(data.accessToken);
      setUser(data.user);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      sessionVersion.current += 1;
      const data = await apiRequest<{ user: AuthUser; accessToken: string }>(
        "/auth/login",
        {
          method: "POST",
          body: { email, password },
        },
      );
      refreshAllowed.current = true;
      persistToken(data.accessToken);
      setUser(data.user);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateProfile = async (data: {
    name?: string | null;
    locale?: string;
    currency?: string;
  }) => {
    if (!accessToken) {
      return { error: new Error("Sessão expirada. Entre novamente.") };
    }
    try {
      const response = await apiRequest<{ user: AuthUser }>("/auth/profile", {
        method: "PATCH",
        token: accessToken,
        body: data,
      });
      setUser(response.user);
      return { error: null };
    } catch (error) {
      if (error instanceof ApiError) {
        return { error };
      }
      return { error: error as Error };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    if (!accessToken) {
      return { error: new Error("Sessão expirada. Entre novamente.") };
    }
    try {
      await apiRequest("/auth/password", {
        method: "PATCH",
        token: accessToken,
        body: { currentPassword, newPassword },
      });
      return { error: null };
    } catch (error) {
      if (error instanceof ApiError) {
        return { error };
      }
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    clearSession();
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // The local session is already cleared even if the server is unavailable.
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        signUp,
        signIn,
        updateProfile,
        changePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
