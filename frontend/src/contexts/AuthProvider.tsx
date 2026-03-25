import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AuthContextValue {
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAdmin(!!localStorage.getItem("adminToken"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  function login(token: string) {
    localStorage.setItem("adminToken", token);
    setIsAdmin(true);
  }

  function logout() {
    localStorage.removeItem("adminToken");
    setIsAdmin(false);
  }

  return <AuthContext.Provider value={{ isAdmin, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
