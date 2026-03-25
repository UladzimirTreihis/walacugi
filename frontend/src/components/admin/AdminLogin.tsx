import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../../store/authSlice";
import useApi from "../../hooks/useApi";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { post, loading } = useApi();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);

    const response = await post<{ token: string }>("/admin/login", { password });

    if (!response || !response.token) {
      setError("Invalid credentials");
      return;
    }

    dispatch(login(response.token));
    navigate("/admin");
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Enter Admin Password</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="password"
        placeholder="Admin Token"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin} disabled={loading}>Login</button>
    </div>
  );
}
