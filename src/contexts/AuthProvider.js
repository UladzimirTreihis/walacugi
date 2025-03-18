import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAdmin(!!localStorage.getItem("adminToken"));
      console.log("Token and admin", localStorage.getItem("adminToken"), isAdmin)
    };

    // Listen for changes in localStorage
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  function login(token) {
    localStorage.setItem("adminToken", token);
    setIsAdmin(true);
  }

  function logout() {
    localStorage.removeItem("adminToken");
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
