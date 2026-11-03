/**
 * tests/test_stability_and_roles.mjs
 * End-to-end Architectural Stability & Role Enforcement Verification Suite
 */

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

async function runStabilityAndRoleTests() {
  console.log('\n======================================================');
  console.log('🧪 LINKVIEW ARCHITECTURAL STABILITY & ROLE TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Health / Server stability
  try {
    const res = await fetch(`${BASE_URL}/api/batches`);
    const json = await res.json();
    assert(res.status === 200 && json.success === true, 'Server is running and batches API responds stably with 200');
  } catch (err) {
    assert(false, `Server health check failed: ${err.message}`);
  }

  // Test 2: Anonymous session resolution
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    const json = await res.json();
    assert(res.status === 200 && json.success === false && json.user === null, 'Unauthenticated /api/auth/me returns success: false with null user (No redirect loop)');
  } catch (err) {
    assert(false, `/api/auth/me unauthenticated check failed: ${err.message}`);
  }

  // Test 3: New Student registration assigns default 'student' role and 'UNASSIGNED' batch
  const testStudentEmail = `learner_${Date.now()}@example.com`;
  let studentUserId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, fullName: 'Autonomous Test Learner' })
    });
    const json = await res.json();
    studentUserId = json.user.id;
    assert(
      res.status === 200 &&
      json.role === 'student' &&
      json.user.batchCode === 'UNASSIGNED' &&
      json.redirectTo === '/student/dashboard',
      `New user (${testStudentEmail}) strictly assigned role 'student' with batch 'UNASSIGNED'`
    );
  } catch (err) {
    assert(false, `New student registration failed: ${err.message}`);
  }

  // Test 4: Repeated login for same student does NOT create duplicate user or alter role
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail })
    });
    const json = await res.json();
    assert(
      res.status === 200 &&
      json.user.id === studentUserId &&
      json.role === 'student',
      'Repeated login for student maintains stable ID and identical role'
    );
  } catch (err) {
    assert(false, `Student re-login check failed: ${err.message}`);
  }

  // Test 5: Admin promotion of student to trainer
  try {
    const promoteRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: studentUserId, action: 'promote_to_trainer', batchCodes: ['PY-2026-A'] })
    });
    const promoteJson = await promoteRes.json();
    assert(
      promoteRes.status === 200 &&
      promoteJson.success === true,
      `Admin successfully promotes student to 'trainer' in database store`
    );
  } catch (err) {
    assert(false, `Promotion to trainer failed: ${err.message}`);
  }

  // Test 6: Promoted user checks auth/me again -> Authoritative role is strictly 'trainer'
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail })
    });
    const json = await res.json();
    assert(
      res.status === 200 &&
      json.role === 'trainer' &&
      json.redirectTo === '/trainer/dashboard',
      `Promoted trainer authoritative role resolved as 'trainer' and routed to /trainer/dashboard`
    );
  } catch (err) {
    assert(false, `Promoted trainer auth/me check failed: ${err.message}`);
  }

  // Test 7: Trainer appears in trainer roster for batch assignments
  try {
    const trainersRes = await fetch(`${BASE_URL}/api/admin/users?role=trainer`);
    const trainersJson = await trainersRes.json();
    const found = (trainersJson.users || []).some(u => u.email.toLowerCase() === testStudentEmail.toLowerCase());
    assert(trainersRes.status === 200 && found, 'Promoted trainer appears in admin trainers roster');
  } catch (err) {
    assert(false, `Querying trainers roster failed: ${err.message}`);
  }

  // Test 8: Demote trainer back to student
  try {
    const demoteRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: studentUserId, action: 'demote_to_student' })
    });
    const demoteJson = await demoteRes.json();
    assert(
      demoteRes.status === 200 &&
      demoteJson.success === true,
      `Admin successfully demotes trainer back to 'student'`
    );
  } catch (err) {
    assert(false, `Demotion to student failed: ${err.message}`);
  }

  // Test 9: Demoted user session check returns 'student' and redirects to student dashboard
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail })
    });
    const json = await res.json();
    assert(
      res.status === 200 &&
      json.role === 'student' &&
      json.redirectTo === '/student/dashboard',
      `Demoted user session strictly resolves back to 'student' and routes to /student/dashboard`
    );
  } catch (err) {
    assert(false, `Demoted user session check failed: ${err.message}`);
  }

  // Test 10: Fixed Admin credentials validation
  try {
    const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.sir@linktest.io', password: 'RahulSir@2026' })
    });
    const adminJson = await adminRes.json();
    assert(
      adminRes.status === 200 &&
      adminJson.success === true &&
      adminJson.role === 'admin' &&
      adminJson.redirectTo === '/admin/dashboard',
      `Fixed Super Admin login resolves with role 'admin' and routes to /admin/dashboard`
    );
  } catch (err) {
    assert(false, `Admin login check failed: ${err.message}`);
  }

  // Test 11: Invalid Admin credentials rejected with 401
  try {
    const invalidAdminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.sir@linktest.io', password: 'wrongpassword' })
    });
    assert(invalidAdminRes.status === 401, 'Invalid admin password rejected with HTTP 401 Unauthorized');
  } catch (err) {
    assert(false, `Invalid admin credentials check failed: ${err.message}`);
  }

  // Test 12: Anti-Flicker & Stability: Concurrent requests are stable
  try {
    const requests = Array.from({ length: 5 }, () =>
      fetch(`${BASE_URL}/api/auth/me`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'rahul.sir@linktest.io' })
      })
    );
    const responses = await Promise.all(requests);
    const all200 = responses.every(r => r.status === 200);
    assert(all200, '5 concurrent auth/me requests succeed without deadlock or race conditions');
  } catch (err) {
    assert(false, `Concurrent auth/me request test failed: ${err.message}`);
  }

  console.log('\n======================================================');
  console.log(`Stability & Role Results: ${passed} / ${passed + failed} passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStabilityAndRoleTests();
