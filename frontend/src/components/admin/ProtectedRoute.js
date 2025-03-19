import { useSelector, useDispatch } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import useApi from "../../hooks/useApi"; // Custom hook for API requests
import { logout, login } from "../../store/authSlice"; // Redux actions

export default function ProtectedRoute() {
  const isAdmin = useSelector((state) => state.auth.isAdmin);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const { post } = useApi();

  useEffect(() => {
    if (!token) return;

    // Validate token with backend
    const verifyToken = async () => {
      const response = await post("/admin/verify-token", { token });

      if (!response || !response.valid) {
        console.error("Invalid token, logging out...");
        dispatch(logout());
      } else {
        dispatch(login(token)); // Ensure Redux is synced with backend
      }
    };

    verifyToken();
  }, [token, dispatch]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  console.log(isAdmin, token)
  return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
}
