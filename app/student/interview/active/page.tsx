"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { VoiceInterviewRoom } from "@/components/interview/VoiceInterviewRoom";

export default function ActiveVoiceInterviewPage() {
  return (
    <AppShell role="student" userName="Aarav Sharma" userEmail="aarav.sharma@linktest.io">
      <VoiceInterviewRoom defaultTrack="Python" />
    </AppShell>
  );
}
