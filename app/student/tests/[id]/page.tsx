import { Suspense } from 'react';
import ExamScreen from '@/components/exam/ExamScreen';

export const dynamic = 'force-dynamic';

async function ExamContainer({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const resolved = await paramsPromise;
  return <ExamScreen testId={resolved.id} />;
}

export default function StudentExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-500">
          Loading examination environment...
        </div>
      }
    >
      <ExamContainer paramsPromise={params} />
    </Suspense>
  );
}
