"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, role, status } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (status === "UNAUTHENTICATED") {
      router.replace("/login?role=admin");
      return;
    }

    if (status === "READY") {
      const adminToken = typeof window !== "undefined" ? sessionStorage.getItem("linktest_admin_token") : null;
      if (role !== "admin" || adminToken !== "linktest_admin_valid_token_2026") {
        router.replace("/login?role=admin");
      }
    }
  }, [mounted, status, role, router]);

  // Initial loading states
  if (!mounted || status === "INITIALIZING" || status === "LOADING_PROFILE") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="card max-w-sm w-full p-8 text-center space-y-4 bg-white border border-[#E2E8F0] shadow-lg rounded-2xl">
          <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-200 text-[#F97316] flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck size={26} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Verifying Admin Credentials</h3>
            <p className="text-xs text-[#64748B] mt-1">
              Confirming authorized administrator token and governance privileges...
            </p>
          </div>
          <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#F97316] h-full w-2/3 rounded-full animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  // Unauthorized or unauthenticated
  const adminToken = typeof window !== "undefined" ? sessionStorage.getItem("linktest_admin_token") : null;
  if (status === "UNAUTHENTICATED" || role !== "admin" || adminToken !== "linktest_admin_valid_token_2026") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-2">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F97316]" />
          <p className="text-xs text-[#64748B] font-medium">Redirecting to administrator login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
