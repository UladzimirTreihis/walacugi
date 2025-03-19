import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../store/authSlice.js"; // Import login action
import useApi from "../../hooks/useApi";
import { useNavigate } from "react-router-dom"; // Redirect after login

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { post, loading } = useApi();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);

    const response = await post("/login", { password });

    if (!response || !response.token) {
      setError("Invalid credentials");
      return;
    }

    dispatch(login(response.token)); // Save token to Redux
    console.log("response: ", response.token)
    navigate("/admin"); // Redirect after login
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Enter Admin Token</h2>
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
