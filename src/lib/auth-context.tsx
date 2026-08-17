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
  createUser,
  getSessionUserId,
  getUserByEmail,
  getUserById,
  setSessionUserId,
  updateUser,
} from "./store";

interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDate: string;
  passportSeries: string;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => User;
  signUp: (input: SignUpInput) => User;
  logout: () => void;
  refresh: () => void;
  updateProfile: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = getSessionUserId();
    if (id) {
      const found = getUserById(id);
      setUser(found ?? null);
    }
    setLoading(false);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const found = getUserByEmail(email);
    if (!found || found.password !== password) {
      throw new Error("Email yoki parol noto'g'ri.");
    }
    setSessionUserId(found.id);
    setUser(found);
    return found;
  }, []);

  const signUp = useCallback((input: SignUpInput) => {
    const created = createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
      birthDate: input.birthDate,
      passportSeries: input.passportSeries,
      phone: input.phone ?? "",
    });
    setSessionUserId(created.id);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(() => {
    setSessionUserId(null);
    setUser(null);
  }, []);

  const refresh = useCallback(() => {
    const id = getSessionUserId();
    setUser(id ? getUserById(id) ?? null : null);
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<User>) => {
      if (!user) return;
      const updated = updateUser(user.id, patch);
      if (updated) setUser(updated);
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, loading, login, signUp, logout, refresh, updateProfile }),
    [user, loading, login, signUp, logout, refresh, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak.");
  return ctx;
}
