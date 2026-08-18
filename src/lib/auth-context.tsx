"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "./types";
import {
  apiLogin,
  apiLogout,
  apiMe,
  apiSignUp,
  apiTelegramCodeLogin,
  apiUpdateProfile,
  type SignUpInput,
} from "./store";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithTelegramCode: (code: string) => Promise<User>;
  signUp: (input: SignUpInput) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (
    patch: Partial<Pick<User, "firstName" | "lastName" | "birthDate" | "passportSeries" | "phone">>
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const current = await apiMe();
    setUser(current);
  }, []);

  useEffect(() => {
    apiMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedIn = await apiLogin(email, password);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const loginWithTelegramCode = useCallback(async (code: string) => {
    const loggedIn = await apiTelegramCodeLogin(code);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const created = await apiSignUp(input);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(async (patch) => {
    const updated = await apiUpdateProfile(patch);
    setUser(updated);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, loginWithTelegramCode, signUp, logout, refresh, updateProfile }),
    [user, loading, login, loginWithTelegramCode, signUp, logout, refresh, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak.");
  return ctx;
}
