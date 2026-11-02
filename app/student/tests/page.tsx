import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { activeTestsStore } from '@/server/repositories/testRepository';
import { Clock, ArrowRight, ShieldCheck, FileCheck2 } from 'lucide-react';

export default function StudentTestsListPage() {
  return (
    <AppShell role="student" userName="Rahul Sharma">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">Assigned Mock Examinations</h2>
          <p className="text-sm text-slate-500">
            View scheduled tests for your enrolled cohorts. Tests with proctoring require camera check & trainer approval.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeTestsStore.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span className="font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    {test.batchName}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5" /> {test.durationMinutes} mins
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{test.title}</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Total Questions: {test.questions.length} · Max Marks: {test.totalMarks}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-600 mb-6">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Proctored (5-Violation Auto-Submit Rule Enabled)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {test.approvalRequired ? 'Requires Trainer Approval' : 'Instant Start'}
                </span>
                <Link
                  href={`/student/tests/${test.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition-colors"
                >
                  <span>Enter Exam</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
