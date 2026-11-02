// scratch/load_test_harness.mjs
// Realistic progressive concurrency load tester for LinkView Platform
// Simulates concurrent student sessions across 4 stages: 5, 10, 25, 50 users

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function simulateStudentWorkflow(userId) {
  const email = `loadtest.user.${userId}@linktest.io`;
  const timings = [];

  const timedFetch = async (url, options) => {
    const start = performance.now();
    try {
      const res = await fetch(url, options);
      const elapsed = performance.now() - start;
      const ok = res.status >= 200 && res.status < 400;
      timings.push({ url, elapsed, ok, status: res.status });
      return { ok, res, elapsed };
    } catch (err) {
      const elapsed = performance.now() - start;
      timings.push({ url, elapsed, ok: false, error: err.message });
      return { ok: false, error: err.message, elapsed };
    }
  };

  // 1. Sign in
  const authRes = await timedFetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Student@2026" }),
  });

  // 2. Fetch dashboard
  await timedFetch(`${BASE_URL}/api/interviews?role=student&email=${encodeURIComponent(email)}`);

  // 3. Start mock interview session
  const sessionRes = await timedFetch(`${BASE_URL}/api/interviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      track: "python",
      difficulty: "intermediate",
      studentName: `Candidate ${userId}`,
    }),
  });

  let sessionId = `sess-${userId}-${Date.now()}`;
  try {
    if (sessionRes.ok) {
      const json = await sessionRes.res.json();
      if (json.data?.id) sessionId = json.data.id;
    }
  } catch {}

  // 4. Record proctoring telemetry
  await timedFetch(`${BASE_URL}/api/proctoring`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      interviewId: sessionId,
      event: { type: "heartbeat", severity: "low", message: "Face verified" },
    }),
  });

  // 5. Submit answer
  await timedFetch(`${BASE_URL}/api/interviews`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      answer: "Python utilizes reference counting and a generational cyclic garbage collector for memory management.",
    }),
  });

  // 6. Retrieve report
  await timedFetch(`${BASE_URL}/api/interviews?id=${sessionId}`);

  return timings;
}

async function runStage(concurrency) {
  console.log(`\n--- Starting Load Stage: ${concurrency} Concurrent Users ---`);
  const stageStart = performance.now();

  const userPromises = [];
  for (let i = 1; i <= concurrency; i++) {
    userPromises.push(simulateStudentWorkflow(i));
  }

  const results = await Promise.all(userPromises);
  const stageElapsedMs = performance.now() - stageStart;

  const allTimings = results.flat();
  const totalRequests = allTimings.length;
  const successfulRequests = allTimings.filter((t) => t.ok).length;
  const failedRequests = totalRequests - successfulRequests;
  const errorRate = (failedRequests / totalRequests) * 100;
  const throughput = Math.round((totalRequests / (stageElapsedMs / 1000)) * 10) / 10;

  const latencies = allTimings.map((t) => t.elapsed).sort((a, b) => a - b);
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const p50 = Math.round(latencies[Math.floor(latencies.length * 0.5)] || 0);
  const p95 = Math.round(latencies[Math.floor(latencies.length * 0.95)] || 0);
  const p99 = Math.round(latencies[Math.floor(latencies.length * 0.99)] || 0);

  console.log(`Duration: ${(stageElapsedMs / 1000).toFixed(2)}s`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${successfulRequests} | Failed: ${failedRequests} (Error Rate: ${errorRate.toFixed(2)}%)`);
  console.log(`Throughput: ${throughput} req/sec`);
  console.log(`Latency (ms): Avg=${avgLatency}ms | p50=${p50}ms | p95=${p95}ms | p99=${p99}ms`);

  return {
    concurrency,
    totalRequests,
    successfulRequests,
    failedRequests,
    errorRate,
    throughput,
    avgLatency,
    p50,
    p95,
    p99,
  };
}

async function runFullLoadSuite() {
  console.log("=== LINKVIEW AUTONOMOUS LOAD & CAPACITY TESTING SUITE ===");
  console.log(`Target: ${BASE_URL}\n`);

  const stages = [5, 10, 25, 50];
  const summary = [];

  for (const c of stages) {
    const res = await runStage(c);
    summary.push(res);
    // Brief 1s inter-stage cooldown
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\n=================== LOAD TEST BENCHMARK SUMMARY ===================");
  console.table(
    summary.map((s) => ({
      "Concurrent Users": s.concurrency,
      "Total Req": s.totalRequests,
      "Success %": `${(100 - s.errorRate).toFixed(1)}%`,
      "Req/sec": s.throughput,
      "Avg Latency": `${s.avgLatency}ms`,
      "p95 Latency": `${s.p95}ms`,
      "p99 Latency": `${s.p99}ms`,
    }))
  );
}

runFullLoadSuite();
