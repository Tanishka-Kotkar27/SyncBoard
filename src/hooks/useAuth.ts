import { useState, useEffect, useCallback } from "react";
import type { User } from "../types";

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8080";
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || "whiteboard";
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "whiteboard-app";

function parseJwt(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function buildUser(token: string): User {
  const payload = parseJwt(token);
  const name = (payload.name as string) || (payload.preferred_username as string) || "User";
  const email = (payload.email as string) || "";
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return { id: payload.sub as string, name, email, initials };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token in localStorage
  useEffect(() => {
    const token = localStorage.getItem("kc_access_token");
    if (token) {
      try {
        const payload = parseJwt(token);
        const exp = payload.exp as number;
        if (exp * 1000 > Date.now()) {
          setUser(buildUser(token));
        } else {
          localStorage.removeItem("kc_access_token");
          localStorage.removeItem("kc_refresh_token");
        }
      } catch {
        localStorage.removeItem("kc_access_token");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        grant_type: "password",
        client_id: CLIENT_ID,
        username,
        password,
      });

      const res = await fetch(
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error_description?: string }).error_description ||
            "Invalid credentials"
        );
      }

      const data = await res.json();
      localStorage.setItem("kc_access_token", data.access_token);
      localStorage.setItem("kc_refresh_token", data.refresh_token);
      setUser(buildUser(data.access_token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("kc_refresh_token");
    if (refreshToken) {
      await fetch(
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            refresh_token: refreshToken,
          }).toString(),
        }
      ).catch(() => {});
    }
    localStorage.removeItem("kc_access_token");
    localStorage.removeItem("kc_refresh_token");
    setUser(null);
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem("kc_access_token") || "";
  }, []);

  return { user, loading, error, login, logout, getToken };
}
