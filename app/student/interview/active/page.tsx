"use client";

import React, { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VoiceInterviewRoom } from "@/components/interview/VoiceInterviewRoom";

export default function ActiveVoiceInterviewPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell role="student">
        <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading AI Interview Room...</div>}>
          <VoiceInterviewRoom defaultTrack="Python" />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
