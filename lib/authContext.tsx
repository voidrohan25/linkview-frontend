"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type AuthRole = "admin" | "trainer" | "student";
export type AuthStatus =
  | "INITIALIZING"
  | "UNAUTHENTICATED"
  | "AUTHENTICATED"
  | "LOADING_PROFILE"
  | "READY"
  | "ERROR";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: AuthRole;
  status?: string;
  batchCode?: string;
  batchCodes?: string[];
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: AuthRole | null;
  status: AuthStatus;
  error: string | null;
  loginWithPassword: (
    email: string,
    password?: string
  ) => Promise<{ success: boolean; redirectTo: string; role: AuthRole; user: AuthUser }>;
  loginWithGoogleEmail: (
    email: string,
    fullName?: string,
    avatarUrl?: string
  ) => Promise<{ success: boolean; redirectTo: string; role: AuthRole; user: AuthUser }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [status, setStatus] = useState<AuthStatus>("INITIALIZING");
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Normalize role to canonical 3 roles: 'admin' | 'trainer' | 'student'
  const normalizeRole = (r?: string): AuthRole => {
    if (!r) return "student";
    const low = r.toLowerCase().trim();
    if (low === "admin" || low === "super_admin" || low === "administrator") return "admin";
    if (low === "trainer" || low === "faculty" || low === "instructor") return "trainer";
    return "student";
  };

  // Authoritatively load the user profile from the database via /api/auth/me
  const fetchAuthoritativeProfile = useCallback(
    async (email: string, initialName?: string, avatarUrl?: string): Promise<AuthUser | null> => {
      try {
        const adminToken = typeof window !== "undefined" ? sessionStorage.getItem("linktest_admin_token") || "" : "";
        const res = await fetch("/api/auth/me", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": adminToken,
          },
          body: JSON.stringify({ email, fullName: initialName, avatarUrl, adminToken }),
        });

        if (!res.ok) {
          throw new Error(`Profile fetch failed with status ${res.status}`);
        }

        const data = await res.json();
        if (data.success && data.user) {
          const resolvedRole = normalizeRole(data.role || data.normalizedRole || data.user.role);
          const resolvedUser: AuthUser = {
            id: data.user.id || `usr-${Date.now()}`,
            email: data.user.email || email,
            fullName: data.user.fullName || data.fullName || email.split("@")[0],
            role: resolvedRole,
            status: data.user.status || "active",
            batchCode: data.user.batchCode,
            batchCodes: data.batchCodes || data.user.batchCodes,
            avatarUrl: data.user.avatarUrl || avatarUrl,
          };

          // Synchronize authoritative state to localStorage cache (non-admin only)
          if (typeof window !== "undefined") {
            try {
              if (resolvedRole !== "admin") {
                localStorage.setItem("linktest_current_user", JSON.stringify(resolvedUser));
                localStorage.setItem("linktest_current_role", resolvedRole);
              }
            } catch {}
          }

          setUser(resolvedUser);
          setRole(resolvedRole);
          setError(null);
          return resolvedUser;
        }
      } catch (err) {
        console.warn("[Auth] Profile fetch network warning:", err);
      }
      return null;
    },
    []
  );

  // Single-run initialization on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function initializeAuth() {
      setStatus("INITIALIZING");
      let discoveredEmail: string | null = null;
      let cachedUser: AuthUser | null = null;

      const isAuthActive = typeof window !== "undefined" && sessionStorage.getItem("linktest_auth_active") === "true";
      const adminToken = typeof window !== "undefined" ? sessionStorage.getItem("linktest_admin_token") : null;
      const isAdminActive = adminToken === "linktest_admin_valid_token_2026";

      // 1. Check local client cache first
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("linktest_current_user");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.email) {
              const parsedRole = normalizeRole(parsed.role);

              // CRITICAL SECURITY RULE: Admin accounts must strictly log in with fixed credentials in an active session
              if (parsedRole === "admin") {
                if (!isAdminActive) {
                  // Purge stale or unauthorized admin cache
                  localStorage.removeItem("linktest_current_user");
                  localStorage.removeItem("linktest_current_role");
                  localStorage.removeItem("linkview_admin_users_cache");
                } else {
                  discoveredEmail = parsed.email;
                  cachedUser = {
                    id: parsed.id,
                    email: parsed.email,
                    fullName: parsed.fullName || "Rahul Sir (Founder & Admin)",
                    role: "admin",
                    batchCode: parsed.batchCode,
                    avatarUrl: parsed.avatarUrl,
                  };
                }
              } else if (isAuthActive) {
                discoveredEmail = parsed.email;
                cachedUser = {
                  id: parsed.id,
                  email: parsed.email,
                  fullName: parsed.fullName || parsed.email.split("@")[0],
                  role: parsedRole,
                  batchCode: parsed.batchCode,
                  avatarUrl: parsed.avatarUrl,
                };
              }
            }
          }
        } catch {}
      }

      // 2. Check active Supabase OAuth session if configured
      if (isSupabaseConfigured && !discoveredEmail) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            discoveredEmail = session.user.email;
          }
        } catch {}
      }

      // 3. If an active verified identity exists, load profile
      if (discoveredEmail && (cachedUser?.role !== "admin" || isAdminActive)) {
        setStatus("LOADING_PROFILE");
        const freshUser = await fetchAuthoritativeProfile(discoveredEmail, cachedUser?.fullName);
        if (freshUser) {
          setStatus("READY");
        } else if (cachedUser && (cachedUser.role !== "admin" || isAdminActive)) {
          setUser(cachedUser);
          setRole(cachedUser.role);
          setStatus("READY");
        } else {
          setUser(null);
          setRole(null);
          setStatus("UNAUTHENTICATED");
        }
      } else {
        setUser(null);
        setRole(null);
        setStatus("UNAUTHENTICATED");
      }
    }

    initializeAuth();
  }, [fetchAuthoritativeProfile]);

  // Login with Password (for Admin or direct accounts)
  const loginWithPassword = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; redirectTo: string; role: AuthRole; user: AuthUser }> => {
    setStatus("LOADING_PROFILE");
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          provider: "email",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed");
      }

      const resolvedRole = normalizeRole(data.role || data.user.role);
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName || data.user.email.split("@")[0],
        role: resolvedRole,
        batchCode: data.user.batchCode,
        status: data.user.status || "active",
      };

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("linktest_auth_active", "true");
          if (resolvedRole === "admin") {
            sessionStorage.setItem("linktest_admin_active", "true");
            sessionStorage.setItem("linktest_admin_token", data.token || "linktest_admin_valid_token_2026");
          } else {
            sessionStorage.removeItem("linktest_admin_active");
            sessionStorage.removeItem("linktest_admin_token");
          }
          localStorage.setItem("linktest_current_user", JSON.stringify(authUser));
          localStorage.setItem("linktest_current_role", resolvedRole);
        } catch {}
      }

      setUser(authUser);
      setRole(resolvedRole);
      setStatus("READY");

      return {
        success: true,
        redirectTo: data.redirectTo || `/${resolvedRole}/dashboard`,
        role: resolvedRole,
        user: authUser,
      };
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
      setStatus("UNAUTHENTICATED");
      throw e;
    }
  };

  // Login with Google Email (via OAuth callback or simulated Google identity)
  const loginWithGoogleEmail = async (
    email: string,
    fullName?: string,
    avatarUrl?: string
  ): Promise<{ success: boolean; redirectTo: string; role: AuthRole; user: AuthUser }> => {
    setStatus("LOADING_PROFILE");
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          fullName,
          avatarUrl,
          provider: "google",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Google sign-in failed");
      }

      const resolvedRole = normalizeRole(data.role || data.user.role);
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName || fullName || data.user.email.split("@")[0],
        role: resolvedRole,
        batchCode: data.user.batchCode,
        status: data.user.status || "active",
        avatarUrl,
      };

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("linktest_auth_active", "true");
          if (resolvedRole === "admin") {
            sessionStorage.setItem("linktest_admin_active", "true");
            sessionStorage.setItem("linktest_admin_token", data.token || "linktest_admin_valid_token_2026");
          } else {
            sessionStorage.removeItem("linktest_admin_active");
            sessionStorage.removeItem("linktest_admin_token");
          }
          localStorage.setItem("linktest_current_user", JSON.stringify(authUser));
          localStorage.setItem("linktest_current_role", resolvedRole);
        } catch {}
      }

      setUser(authUser);
      setRole(resolvedRole);
      setStatus("READY");

      return {
        success: true,
        redirectTo: data.redirectTo || `/${resolvedRole}/dashboard`,
        role: resolvedRole,
        user: authUser,
      };
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
      setStatus("UNAUTHENTICATED");
      throw e;
    }
  };

  // Re-fetch authoritative user profile from database
  const refreshProfile = async (): Promise<AuthUser | null> => {
    if (!user?.email) return null;
    return fetchAuthoritativeProfile(user.email, user.fullName, user.avatarUrl);
  };

  // Logout cleanly and purge all session credentials
  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch {}

    if (typeof window !== "undefined") {
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
            localStorage.removeItem(key);
          }
        });
        localStorage.removeItem("linktest_current_user");
        localStorage.removeItem("linktest_current_role");
        localStorage.removeItem("linkview_admin_users_cache");
        sessionStorage.clear();
      } catch {}
    }

    setUser(null);
    setRole(null);
    setError(null);
    setStatus("UNAUTHENTICATED");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        status,
        error,
        loginWithPassword,
        loginWithGoogleEmail,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
