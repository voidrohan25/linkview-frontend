"use client";

import React, { use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { VoiceInterviewRoom } from "@/components/interview/VoiceInterviewRoom";

export default function StudentInterviewByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <AppShell role="student" userName="Aarav Sharma" userEmail="aarav.sharma@linktest.io">
      <VoiceInterviewRoom initialSessionId={resolvedParams.id} defaultTrack="Python" />
    </AppShell>
  );
}
