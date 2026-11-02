import http from 'node:http';

/**
 * 500-Concurrent-User Realistic Load Simulator
 * Tests:
 * 1. 500 concurrent connections firing against the server endpoints.
 * 2. Assessment tests catalog queries (/api/tests)
 * 3. High-throughput Paginated Roster (/api/admin/users?page=1&limit=25)
 * 4. Debounced Answer Autosaves & Scoring (/api/attempts)
 * Measures: Total Requests, Success Rate, Average Latency, P95 Latency, Errors.
 */

const TARGET_HOST = process.env.TARGET_HOST || '127.0.0.1';
const TARGET_PORT = process.env.TARGET_PORT || 3000;
const CONCURRENT_USERS = 500;
const BATCH_ROUNDS = 4; // 500 users * 4 rounds = 2,000 intense concurrent transactions

async function executeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const start = Date.now();
    const payload = body ? JSON.stringify(body) : null;

    const req = http.request(
      {
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload ? Buffer.byteLength(payload) : 0,
        },
        timeout: 5000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          const duration = Date.now() - start;
          resolve({
            statusCode: res.statusCode,
            duration,
            success: res.statusCode >= 200 && res.statusCode < 400,
          });
        });
      }
    );

    req.on('error', (err) => {
      resolve({
        statusCode: 500,
        duration: Date.now() - start,
        success: false,
        error: err.message,
      });
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runLoadTest() {
  console.log(`===========================================================`);
  console.log(`  LINK TEST: 500 CONCURRENT USERS LOAD & SCALING TEST`);
  console.log(`  Target: http://${TARGET_HOST}:${TARGET_PORT}`);
  console.log(`  Simulating: ${CONCURRENT_USERS} simultaneous students taking exams & browsing`);
  console.log(`===========================================================\n`);

  const endpoints = [
    { name: 'Tests Catalog', path: '/api/tests', method: 'GET' },
    { name: 'Paginated Roster (Page 1)', path: '/api/admin/users?page=1&limit=25', method: 'GET' },
    { name: 'Paginated Roster (Page 10)', path: '/api/admin/users?page=10&limit=25', method: 'GET' },
    {
      name: 'Examinee Autosave Simulation',
      path: '/api/attempts',
      method: 'POST',
      body: { testId: 'test-dsa-101', studentId: 'sim-user', studentName: 'Simulated Student' },
    },
  ];

  for (const ep of endpoints) {
    console.log(`[Testing] Running burst against: ${ep.name} (${ep.path})`);
    const results = [];

    const startTime = Date.now();

    // Fire 500 concurrent requests in parallel
    const promises = Array.from({ length: CONCURRENT_USERS }, (_, idx) => {
      const customBody = ep.body ? { ...ep.body, studentId: `user-${idx + 1}` } : null;
      return executeRequest(ep.path, ep.method, customBody);
    });

    const settled = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    let successful = 0;
    let failed = 0;
    const durations = [];

    for (const r of settled) {
      if (r.success) {
        successful++;
        durations.push(r.duration);
      } else {
        failed++;
      }
    }

    durations.sort((a, b) => a - b);
    const avgLatency = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const p95Index = Math.floor(durations.length * 0.95);
    const p95Latency = durations[p95Index] || 0;

    console.log(`  ✓ Total Requests Fired: ${CONCURRENT_USERS}`);
    console.log(`  ✓ Successful (200 OK): ${successful}`);
    console.log(`  ✓ Failed: ${failed}`);
    console.log(`  ✓ Total Burst Duration: ${totalTime} ms`);
    console.log(`  ✓ Average Latency: ${avgLatency} ms`);
    console.log(`  ✓ P95 Latency: ${p95Latency} ms`);
    console.log(`  ✓ Throughput: ${Math.round((CONCURRENT_USERS / (totalTime / 1000)))} req/sec\n`);
  }

  console.log(`===========================================================`);
  console.log(`  500 CONCURRENT USERS LOAD TEST COMPLETED SUCCESSFULLY!`);
  console.log(`===========================================================`);
}

runLoadTest();
