import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

const API_URL = process.env.REACT_APP_API_URL;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
type HeadersMap = Record<string, string>;

export default function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const csrfToken = useSelector((state: RootState) => state.auth.csrfToken);

  const request = useCallback(async (
    endpoint: string,
    method: HttpMethod,
    body: unknown = null,
    headers: HeadersMap = {}
  ): Promise<unknown | null> => {
    setLoading(true);
    setError(null);

    try {
      const isFormData = body instanceof FormData;
      const options: RequestInit = {
        method,
        credentials: "include",
        headers: {
          ...headers,
          ...(method !== "GET" && method !== "HEAD" && csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
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

      return (await response.json()) as unknown;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [csrfToken]);

  const get = useCallback(<T,>(endpoint: string, headers: HeadersMap = {}) =>
    request(endpoint, "GET", null, headers) as Promise<T | null>, [request]);
  const post = useCallback(<T,>(endpoint: string, body: unknown, headers: HeadersMap = {}) =>
    request(endpoint, "POST", body, headers) as Promise<T | null>, [request]);
  const put = useCallback(<T,>(endpoint: string, body: unknown, headers: HeadersMap = {}) =>
    request(endpoint, "PUT", body, headers) as Promise<T | null>, [request]);
  const del = useCallback(<T,>(endpoint: string, headers: HeadersMap = {}) =>
    request(endpoint, "DELETE", null, headers) as Promise<T | null>, [request]);

  return useMemo(() => ({
    loading,
    error,
    get,
    post,
    put,
    del
  }), [del, error, get, loading, post, put]);
}
