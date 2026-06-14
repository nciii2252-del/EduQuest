import React, { createContext, useContext, useState, ReactNode } from "react";
import { loginUser } from "@/services/userService";

export type UserRole = "guru" | "murid" | "admin";

export interface User {
  id: string;
  email: string;
  nama: string;
  role: UserRole;
  created_at: string;
  xp?: number;
  level?: number;
  streak?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEYS = ["codequest-user"];

function clearStoredUsers() {
  try {
    AUTH_STORAGE_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch {
    // Ignore storage errors so auth still works in private/locked browsers.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    clearStoredUsers();
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Email dan kata sandi wajib diisi");
      }

      const userData = await loginUser(email.trim(), password, role);
      setUser(userData);
    } catch (err: any) {
      setError(err.message || "Login gagal");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    clearStoredUsers();
    setError(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user,
        isLoading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
