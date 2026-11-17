import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCsrfToken } from "../store/authSlice";
import type { RootState } from "../store/store";

const API_URL = process.env.REACT_APP_API_URL;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
type HeadersMap = Record<string, string>;

async function refreshCsrfToken(): Promise<string | null> {
  const csrfResponse = await fetch(`${API_URL}/admin/csrf`, {
    method: "GET",
    credentials: "include"
  });
  if (!csrfResponse.ok) return null;
  const csrfData = (await csrfResponse.json()) as { csrfToken?: string };
  return typeof csrfData.csrfToken === "string" ? csrfData.csrfToken : null;
}

export default function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const csrfToken = useSelector((state: RootState) => state.auth.csrfToken);
  const dispatch = useDispatch();

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
      const isMutation = method !== "GET" && method !== "HEAD";

      const buildOptions = (token: string | null): RequestInit => ({
        method,
        credentials: "include",
        headers: {
          ...headers,
          ...(isMutation && token ? { "X-CSRF-Token": token } : {}),
          ...(isFormData ? {} : { "Content-Type": "application/json" })
        },
        ...(body && !["GET", "HEAD", "DELETE"].includes(method)
          ? { body: isFormData ? (body as FormData) : JSON.stringify(body) }
          : {})
      });

      const url = new URL(`${API_URL}${endpoint}`);
      const browserParams = new URLSearchParams(window.location.search);
      const lang = browserParams.get("lang") || window.localStorage.getItem("walacugi.lang");
      if (lang && !url.searchParams.has("lang")) {
        url.searchParams.set("lang", lang);
      }

      let response = await fetch(url.toString(), buildOptions(csrfToken));

      // Stale CSRF after redeploy / long session: refresh once and retry.
      if (response.status === 403 && isMutation && endpoint !== "/admin/login") {
        const freshToken = await refreshCsrfToken();
        if (freshToken) {
          dispatch(setCsrfToken(freshToken));
          response = await fetch(url.toString(), buildOptions(freshToken));
        }
      }

      if (!response.ok) {
        let detail = `Error ${response.status}: ${response.statusText}`;
        try {
          const payload = (await response.json()) as { error?: unknown };
          if (typeof payload.error === "string" && payload.error.trim()) {
            detail = payload.error;
          }
        } catch {
          // keep status text when body is not JSON
        }
        throw new Error(detail);
      }

      return (await response.json()) as unknown;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [csrfToken, dispatch]);

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
