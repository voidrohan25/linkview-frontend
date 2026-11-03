"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VoiceInterviewRoom } from "@/components/interview/VoiceInterviewRoom";

export default function ActiveVoiceInterviewPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell role="student">
        <VoiceInterviewRoom defaultTrack="Python" />
      </AppShell>
    </ProtectedRoute>
  );
}
