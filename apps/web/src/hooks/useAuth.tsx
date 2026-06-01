/* eslint-disable react-refresh/only-export-components */
import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { apiRequest, ApiError } from "@/lib/api";

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

  const persistToken = (token: string | null) => {
    setAccessToken(token);
  };

  const fetchMe = async (token: string) => {
    const data = await apiRequest<{ user: AuthUser }>("/auth/me", {
      token,
    });
    setUser(data.user);
  };

  const refreshSession = async () => {
    try {
      const data = await apiRequest<{ accessToken: string }>("/auth/refresh", {
        method: "POST",
      });
      if (data?.accessToken) {
        persistToken(data.accessToken);
        await fetchMe(data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (accessToken) {
          try {
            await fetchMe(accessToken);
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
              const refreshed = await refreshSession();
              if (!refreshed && isMounted) {
                persistToken(null);
                setUser(null);
              }
            } else {
              throw error;
            }
          }
        } else {
          await refreshSession();
        }
      } catch {
        if (isMounted) {
          persistToken(null);
          setUser(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const data = await apiRequest<{ user: AuthUser; accessToken: string }>(
        "/auth/register",
        {
          method: "POST",
          body: { email, password },
        },
      );
      persistToken(data.accessToken);
      setUser(data.user);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiRequest<{ user: AuthUser; accessToken: string }>(
        "/auth/login",
        {
          method: "POST",
          body: { email, password },
        },
      );
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
      return { error: new Error("User not authenticated") };
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
      return { error: new Error("User not authenticated") };
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
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      persistToken(null);
      setUser(null);
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
