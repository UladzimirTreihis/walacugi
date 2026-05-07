// AdminPage.tsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import AdminLogin from "./AdminLogin";
import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar"
import type { RootState } from "../../store/store";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  useEffect(() => {
    setIsLoggedIn(isAdmin);
  }, [isAdmin]);

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <AdminNavbar />
          <Outlet />
        </div>
      ) : (
        <AdminLogin />
      )}
    </div>
  );
}
