import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

const API_URL = process.env.REACT_APP_API_URL;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
type HeadersMap = Record<string, string>;

export default function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useSelector((state: RootState) => state.auth.token);

  async function request<T>(
    endpoint: string,
    method: HttpMethod,
    body: unknown = null,
    headers: HeadersMap = {}
  ): Promise<T | null> {
    setLoading(true);
    setError(null);

    try {
      const isFormData = body instanceof FormData;
      const options: RequestInit = {
        method,
        headers: {
          ...headers,
          Authorization: `Bearer ${token ?? ""}`,
          ...(isFormData ? {} : { "Content-Type": "application/json" })
        }
      };

      if (body && !["GET", "HEAD", "DELETE"].includes(method)) {
        options.body = isFormData ? (body as FormData) : JSON.stringify(body);
      }

      const url = new URL(`${API_URL}${endpoint}`);
      const browserParams = new URLSearchParams(window.location.search);
      const lang = browserParams.get("lang") || window.localStorage.getItem("walacugi.lang");
      if (lang && !url.searchParams.has("lang")) {
        url.searchParams.set("lang", lang);
      }

      const response = await fetch(url.toString(), options);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    get: <T>(endpoint: string, headers: HeadersMap = {}) =>
      request<T>(endpoint, "GET", null, headers),
    post: <T>(endpoint: string, body: unknown, headers: HeadersMap = {}) =>
      request<T>(endpoint, "POST", body, headers),
    put: <T>(endpoint: string, body: unknown, headers: HeadersMap = {}) =>
      request<T>(endpoint, "PUT", body, headers),
    del: <T>(endpoint: string, headers: HeadersMap = {}) =>
      request<T>(endpoint, "DELETE", null, headers)
  };
}
