// scratch/test_auth_suite.mjs
// Comprehensive test suite for LinkView Authentication, Roles, and Role Persistence

async function runAuthTests() {
  const baseUrl = "http://localhost:3000";
  console.log("=== LinkView Autonomous Auth & Role Test Suite ===");
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
    }
  }

  // 1. Missing email
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "", password: "123" }),
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, "Missing email rejected with 400");
  } catch (e) {
    assert(false, `Missing email test threw: ${e.message}`);
  }

  // 2. Normal student email & password login
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "aarav.sharma@linktest.io", password: "Student@2026" }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.role === "student" && data.redirectTo === "/student/dashboard", "Student login returns student role and student dashboard redirect");
  } catch (e) {
    assert(false, `Student login threw: ${e.message}`);
  }

  // 3. Configured Fixed Admin login with correct password
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "rahul.sir@linktest.io", password: "RahulSir@2026" }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.role === "admin" && data.redirectTo === "/admin/dashboard", "Fixed Admin login returns admin role and admin dashboard redirect");
  } catch (e) {
    assert(false, `Admin login threw: ${e.message}`);
  }

  // 4. Fixed Admin login with invalid password
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "rahul.sir@linktest.io", password: "WrongAdminPassword123" }),
    });
    const data = await res.json();
    assert(res.status === 401 && data.success === false, "Admin login with wrong password rejected with 401");
  } catch (e) {
    assert(false, `Admin wrong password threw: ${e.message}`);
  }

  // 5. Google Sign-In with brand new email -> MUST default to Student
  const testNewGoogleEmail = `student.test.${Date.now()}@gmail.com`;
  let studentUserId = "";
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testNewGoogleEmail, provider: "google" }),
    });
    const data = await res.json();
    studentUserId = data.user.id;
    assert(res.status === 200 && data.role === "student" && data.redirectTo === "/student/dashboard", "New Google Sign-in strictly receives 'student' role");
  } catch (e) {
    assert(false, `New Google Sign-in threw: ${e.message}`);
  }

  // 6. Admin promotes Student to Trainer
  try {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: studentUserId, action: "promote_to_trainer", batchCodes: ["PY-2026-A"] }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, "Admin promotes Student to Trainer via /api/admin/users");
  } catch (e) {
    assert(false, `Admin promotion threw: ${e.message}`);
  }

  // 7. Promoted user logs in again with Google -> Role MUST remain 'trainer' (Role persistence test)
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testNewGoogleEmail, provider: "google" }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.role === "trainer" && data.redirectTo === "/trainer/dashboard", "Existing promoted Trainer preserves 'trainer' role upon Google re-login");
  } catch (e) {
    assert(false, `Trainer relogin threw: ${e.message}`);
  }

  // 8. Admin demotes Trainer back to Student
  try {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: studentUserId, action: "demote_to_student" }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, "Admin demotes Trainer back to Student");
  } catch (e) {
    assert(false, `Admin demotion threw: ${e.message}`);
  }

  // 9. Demoted user logs in -> Role is back to Student
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testNewGoogleEmail, provider: "google" }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.role === "student" && data.redirectTo === "/student/dashboard", "Demoted user logs in and correctly receives 'student' role");
  } catch (e) {
    assert(false, `Demoted user relogin threw: ${e.message}`);
  }

  console.log(`\nAuth Suite Results: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
}

runAuthTests();
