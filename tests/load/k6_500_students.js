import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Load Test Scenario: 500 Concurrent Students
 * Simulates:
 * 1. 500 Students simultaneously logging in and fetching assigned tests.
 * 2. Simultaneous test start requests.
 * 3. High-frequency debounced answer autosaves.
 * 4. Final burst test submission.
 */

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp-up to 100 users
    { duration: '1m', target: 500 },   // Ramp-up to full 500 concurrent students
    { duration: '2m', target: 500 },   // Sustained 500 students peak load
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],  // 95% of requests must complete below 800ms
    http_req_failed: ['rate<0.01'],    // Under 1% error rate
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  const studentId = `std-sim-${__VU}`;

  // Step 1: Fetch Available Assessments
  const testListRes = http.get(`${BASE_URL}/api/tests`);
  check(testListRes, {
    'Tests catalog status 200': (r) => r.status === 200,
  });

  // Step 2: Request Attempt Start
  const startPayload = JSON.stringify({
    testId: 'test-dsa-101',
    studentId,
    studentName: `Student ${__VU}`,
  });

  const startRes = http.post(`${BASE_URL}/api/attempts`, startPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(startRes, {
    'Start attempt initialized': (r) => r.status === 200,
  });

  const attemptId = startRes.json('data.id');

  // Step 3: Simulate active examinee autosaves
  if (attemptId) {
    for (let i = 1; i <= 4; i++) {
      sleep(5); // Simulate think time between questions

      const autosavePayload = JSON.stringify({
        attemptId,
        answers: { [`q${i}`]: `Option ${i}` },
      });

      const saveRes = http.patch(`${BASE_URL}/api/attempts`, autosavePayload, {
        headers: { 'Content-Type': 'application/json' },
      });

      check(saveRes, {
        'Answer autosaved': (r) => r.status === 200,
      });
    }

    // Step 4: Final Submission
    const submitPayload = JSON.stringify({ attemptId });
    const submitRes = http.post(`${BASE_URL}/api/attempts/submit`, submitPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(submitRes, {
      'Submission recorded and scored': (r) => r.status === 200,
    });
  }

  sleep(1);
}
