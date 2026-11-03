"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthRole } from "@/lib/authContext";
import { ShieldAlert, ShieldCheck } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AuthRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, role, status } = useAuth();

  useEffect(() => {
    if (status === "UNAUTHENTICATED") {
      router.replace("/login");
    } else if (status === "READY" && role && !allowedRoles.includes(role)) {
      // Authenticated user attempted to access an unauthorized route
      // Redirect safely to their own role's dashboard
      router.replace(`/${role}/dashboard`);
    }
  }, [status, role, allowedRoles, router]);

  // 1. Controlled, non-flickering loading screen while authentication initializes
  if (status === "INITIALIZING" || status === "LOADING_PROFILE") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="card max-w-sm w-full p-8 text-center space-y-4 bg-white border border-[#E2E8F0] shadow-lg rounded-2xl">
          <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-200 text-[#F97316] flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck size={26} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Verifying Session</h3>
            <p className="text-xs text-[#64748B] mt-1">
              Validating role permissions and loading authoritative database records...
            </p>
          </div>
          <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#F97316] h-full w-2/3 rounded-full animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: waiting for redirect
  if (status === "UNAUTHENTICATED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-2">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F97316]" />
          <p className="text-xs text-[#64748B] font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // 3. Authenticated but unauthorized role: waiting for redirect to appropriate dashboard
  if (status === "READY" && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="card max-w-md w-full p-6 text-center space-y-4 bg-white border border-red-200 shadow-md rounded-2xl">
          <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Access Restricted</h3>
            <p className="text-xs text-[#64748B] mt-1">
              Your account ({user?.email}) has role <strong className="uppercase">{role}</strong>.
              Redirecting you to your assigned dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized: render page content
  return <>{children}</>;
}
