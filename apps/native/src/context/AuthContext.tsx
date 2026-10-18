import {
  useContext,
  createContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";

import { getMeRequest, loginRequest, type User } from "../services/authApi";

import {
  deleteAuthToken,
  getAuthToken,
  saveAuthCredentials,
  getRefreshToken,
} from "../storage/authStorage";
import {
  apiFetch,
  ApiError,
  resetApiSession,
  setUnauthorizedHandler,
  setTokenRenewal,
} from "../services/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cancelAlerts } from "../services/nativeAlerts";
import * as Notifications from "expo-notifications";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  retrySession: () => void;
  sessionError: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [attempt, setAttempt] = useState(0),
    [sessionError, setSessionError] = useState("");
  const sessionEpoch = useRef(0);
  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    setIsLoading(true);
    setSessionError("");
    setUnauthorizedHandler(() => {
      void logout();
    });
    setTokenRenewal(async () => {
      const epoch = sessionEpoch.current;
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;
      const result = await apiFetch<{
        token: string;
        refreshToken: string;
        user: User;
      }>("/api/auth/refresh", {
        method: "POST",
        headers: { "X-Auth-Client": "native", "X-Auth-Refresh": "1" },
        body: JSON.stringify({ refreshToken }),
      });
      if (epoch !== sessionEpoch.current)
        throw new ApiError("Session changed", 409);
      await saveAuthCredentials(result.token, result.refreshToken);
      setToken(result.token);
      setUser(result.user);
      return result.token;
    });
    async function loadStoredAuth() {
      try {
        const storedToken = await getAuthToken();

        if (!storedToken) {
          return;
        }

        const result = await getMeRequest(storedToken);

        setToken(await getAuthToken());
        setUser(result.user);
      } catch (error) {
        setSessionError(
          error instanceof ApiError && error.status === 401
            ? "Your session has expired. Log in again."
            : "Could not restore your session. Check your connection and try again.",
        );

        if (error instanceof ApiError && error.status === 401)
          await deleteAuthToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredAuth();
    return () => {
      setUnauthorizedHandler(undefined);
      setTokenRenewal(undefined);
    };
  }, [attempt]);

  async function login(email: string, password: string) {
    sessionEpoch.current++;
    resetApiSession();
    const result = await loginRequest(email, password);

    await saveAuthCredentials(result.token, result.refreshToken ?? null);

    setToken(result.token);
    setUser(result.user);
  }

  async function logout() {
    sessionEpoch.current++;
    resetApiSession();
    setToken(null);
    setUser(null);
    await cancelAlerts();
    const refreshToken = await getRefreshToken();
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
    await Notifications.dismissAllNotificationsAsync().catch(() => {});
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(
      keys.filter(
        (key) =>
          key.startsWith("workout:") ||
          key.startsWith("browse:") ||
          key.startsWith("template-edit:"),
      ),
    );
    await deleteAuthToken();
    await apiFetch("/api/auth/logout", {
      method: "POST",
      headers: { "X-Auth-Client": "native" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }

  async function refreshUser() {
    if (!token) {
      return;
    }

    const result = await getMeRequest(token);

    setUser(result.user);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
        retrySession: () => setAttempt((value) => value + 1),
        sessionError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
