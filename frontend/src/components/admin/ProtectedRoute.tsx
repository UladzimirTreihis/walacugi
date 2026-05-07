import { useSelector, useDispatch } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import useApi from "../../hooks/useApi";
import { logout } from "../../store/authSlice";
import type { RootState } from "../../store/store";

export default function ProtectedRoute() {
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);
  const dispatch = useDispatch();
  const { get } = useApi();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const response = await get<{ isAdmin: boolean }>("/admin/me");
      if (!response?.isAdmin) {
        dispatch(logout());
      }
      setChecking(false);
    };
    void verifyToken();
  }, [dispatch, get]);

  if (checking) {
    return null;
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
