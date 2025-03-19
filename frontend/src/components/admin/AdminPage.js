// AdminPage.js
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import AdminLogin from "./AdminLogin";
import AdminNewsForm from "./AdminNewsForm";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@mui/material";
import AdminNavbar from "./AdminNavbar"

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    // Check if a token is already stored
    console.log(token)
    if (token) {
      setIsLoggedIn(true);
    }
    console.log("Logged", isLoggedIn)
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };


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
