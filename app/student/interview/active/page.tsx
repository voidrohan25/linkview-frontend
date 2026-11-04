"use client";

import React, { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VoiceInterviewRoom } from "@/components/interview/VoiceInterviewRoom";

export default function ActiveVoiceInterviewPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-xs text-slate-400">
            Loading AI Interview Room...
          </div>
        }
      >
        <VoiceInterviewRoom defaultTrack="Python" />
      </Suspense>
    </ProtectedRoute>
  );
}
