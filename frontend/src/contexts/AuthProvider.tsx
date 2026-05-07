import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useDispatch } from "react-redux";
import { login as loginAction, logout as logoutAction, setCsrfToken } from "../store/authSlice";

interface AuthContextValue {
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const dispatch = useDispatch();
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const hydrate = async () => {
      try {
        const meResponse = await fetch(`${apiUrl}/admin/me`, {
          method: "GET",
          credentials: "include"
        });
        if (!meResponse.ok) {
          setIsAdmin(false);
          dispatch(logoutAction());
          return;
        }
        const me = (await meResponse.json()) as { isAdmin?: boolean };
        if (!me.isAdmin) {
          setIsAdmin(false);
          dispatch(logoutAction());
          return;
        }

        const csrfResponse = await fetch(`${apiUrl}/admin/csrf`, {
          method: "GET",
          credentials: "include"
        });
        if (!csrfResponse.ok) {
          setIsAdmin(false);
          dispatch(logoutAction());
          return;
        }
        const csrfData = (await csrfResponse.json()) as { csrfToken?: string };
        dispatch(loginAction({ csrfToken: csrfData.csrfToken ?? null }));
        setIsAdmin(true);
      } catch {
        setIsAdmin(false);
        dispatch(logoutAction());
      }
    };

    void hydrate();
  }, [apiUrl, dispatch]);

  async function login() {
    const csrfResponse = await fetch(`${apiUrl}/admin/csrf`, {
      method: "GET",
      credentials: "include"
    });
    const csrfData = (await csrfResponse.json()) as { csrfToken?: string };
    dispatch(loginAction({ csrfToken: csrfData.csrfToken ?? null }));
    setIsAdmin(true);
  }

  function logout() {
    dispatch(setCsrfToken(null));
    dispatch(logoutAction());
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
