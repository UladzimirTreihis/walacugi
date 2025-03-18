import { useState } from "react";
import { useSelector } from "react-redux";

const API_URL = process.env.REACT_APP_API_URL; // Read from .env

export default function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useSelector((state) => state.auth.token); // Get token from Redux

  async function request(endpoint, method, body = null, headers = {}) {
    setLoading(true);
    setError(null);

    try {
      const isFormData = body instanceof FormData;
      const options = {
        method,
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`, // Attach token for protected routes
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
        },
      };
  
      if (body && method !== "GET" && method !== "HEAD" && method !== "DELETE") {
        options.body = isFormData ? body : JSON.stringify(body);
      }
      const response = await fetch(`${API_URL}${endpoint}`, options);
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      
      return response.json();
    } catch (err) {
      setError(err.message);
      console.error(`API ${method} ${endpoint} failed:`, err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    get: (endpoint, headers = {}) => request(endpoint, "GET", null, headers),
    post: (endpoint, body, headers = {}) => request(endpoint, "POST", body, headers),
    put: (endpoint, body, headers = {}) => request(endpoint, "PUT", body, headers),
    del: (endpoint, headers = {}) => request(endpoint, "DELETE", null, headers),
  };
}
  