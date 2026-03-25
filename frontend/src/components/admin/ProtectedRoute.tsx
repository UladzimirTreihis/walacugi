import { useSelector, useDispatch } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import useApi from "../../hooks/useApi";
import { logout, login } from "../../store/authSlice";
import type { RootState } from "../../store/store";

export default function ProtectedRoute() {
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const { post } = useApi();

  useEffect(() => {
    if (!token) return;
    const verifyToken = async () => {
      const response = await post<{ valid: boolean }>("/admin/verify-token", { token });
      if (!response || !response.valid) {
        dispatch(logout());
      } else {
        dispatch(login(token));
      }
    };
    verifyToken();
  }, [token, dispatch]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
}
