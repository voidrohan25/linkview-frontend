import { GET as getTests } from '../app/api/tests/route.ts';
import { GET as getBatches } from '../app/api/batches/route.ts';
import { POST as generateMockTest } from '../app/api/ai-mock-test/route.ts';
import { POST as startInterview, PUT as submitInterview } from '../app/api/interviews/route.ts';
import { GET as getLiveClass, POST as postLiveClass } from '../app/api/live-classes/route.ts';

async function runApiSuite() {
  console.log('🧪 Starting API Endpoints Verification Suite...\n');

  // 1. Tests API (Verify answer keys stripped from student response)
  console.log('[1] Testing GET /api/tests...');
  const testsRes = await getTests();
  const testsData = await testsRes.json();
  if (!testsData.success || !Array.isArray(testsData.data) || testsData.data.length === 0) {
    throw new Error('GET /api/tests failed');
  }
  const firstTest = testsData.data[0];
  if (firstTest.questions[0].correctAnswer !== undefined) {
    throw new Error('SECURITY VIOLATION: correctAnswer leaked to student API endpoint');
  }
  console.log('✅ Sanitized test response verified. No answer keys leaked.');

  // 2. Batches API
  console.log('[2] Testing GET /api/batches...');
  const batchesRes = await getBatches();
  const batchesData = await batchesRes.json();
  if (!batchesData.success || batchesData.data.length === 0) {
    throw new Error('GET /api/batches failed');
  }
  console.log(`✅ Loaded ${batchesData.data.length} active cohorts.`);

  // 3. AI Mock Test API
  console.log('[3] Testing POST /api/ai-mock-test...');
  const mockReq = new Request('http://localhost:3000/api/ai-mock-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: 'java', questionCount: 2 }),
  });
  const mockRes = await generateMockTest(mockReq);
  const mockData = await mockRes.json();
  if (!mockData.success || mockData.data.questions.length !== 2) {
    throw new Error('POST /api/ai-mock-test failed');
  }
  console.log(`✅ AI Mock test generated successfully: "${mockData.data.title}" (${mockData.data.questions.length} questions).`);

  // 4. AI Interview API
  console.log('[4] Testing AI Placement Interview session...');
  const startIntReq = new Request('http://localhost:3000/api/interviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ track: 'dsa' }),
  });
  const startIntRes = await startInterview(startIntReq);
  const startIntData = await startIntRes.json();
  if (!startIntData.success || !startIntData.data.id) {
    throw new Error('Start interview failed');
  }

  const putIntReq = new Request('http://localhost:3000/api/interviews', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: startIntData.data.id,
      answer: 'We maintain max_ending_here and max_so_far using Kadane algorithm in O(n) time and O(1) auxiliary space.',
    }),
  });
  const putIntRes = await submitInterview(putIntReq);
  const putIntData = await putIntRes.json();
  if (!putIntData.success || putIntData.data.history.length === 0) {
    throw new Error('Submit interview turn failed');
  }
  console.log(`✅ Interview evaluated. Score awarded: ${putIntData.data.history[0].score}/10.`);

  // 5. Live Classes & In-Lecture Polls
  console.log('[5] Testing Live Classes & Interactive Polls...');
  const liveRes = await getLiveClass();
  const liveData = await liveRes.json();
  if (!liveData.success || !liveData.data.activePoll) {
    throw new Error('GET /api/live-classes failed');
  }
  console.log(`✅ Live class retrieved: "${liveData.data.title}" with ${liveData.data.attendeesCount} participants.`);

  console.log('\n🎉 ALL 5 CORE BACKEND API MODULES VERIFIED SUCCESSFULLY!');
}

runApiSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
