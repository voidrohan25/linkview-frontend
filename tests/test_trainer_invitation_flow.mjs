import { createServer } from 'http';

// We can test the API by starting next dev or testing via node fetch if running dev server,
// or we can invoke the route handlers directly in a unit test!
import { POST as adminUsersPost, GET as adminUsersGet } from '../app/api/admin/users/route.ts';
import { POST as authMePost } from '../app/api/auth/me/route.ts';

async function runTest() {
  console.log('🧪 Starting Trainer Invitation & Role Separation Verification...\n');

  // Step 1: Admin invites a new trainer with specific Gmail
  const trainerEmail = 'dr.anand.ai@gmail.com';
  const trainerName = 'Dr. Anand Raman';
  const batchCode = 'PYAI2026';

  console.log(`[Step 1] Super Admin invites trainer: ${trainerName} (${trainerEmail})...`);
  const inviteReq = new Request('http://localhost:3000/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'origin': 'http://localhost:3000' },
    body: JSON.stringify({
      fullName: trainerName,
      email: trainerEmail,
      role: 'trainer',
      batchCode: batchCode,
    }),
  });

  const inviteRes = await adminUsersPost(inviteReq);
  const inviteData = await inviteRes.json();

  console.log('Invite Response Status:', inviteRes.status);
  console.log('Invite Response Data:', {
    success: inviteData.success,
    role: inviteData.data?.role,
    status: inviteData.data?.status,
    inviteLink: inviteData.inviteLink,
    inviteToken: inviteData.inviteToken,
  });

  if (inviteData.data?.role !== 'trainer') {
    throw new Error(`❌ FAILED: Expected role 'trainer', got '${inviteData.data?.role}'`);
  }
  if (!inviteData.inviteLink?.includes('inviteToken')) {
    throw new Error('❌ FAILED: Invitation link missing inviteToken');
  }
  console.log('✅ Step 1 Passed: Trainer invited with role "trainer" and invite link generated.\n');

  // Step 2: Query admin users list filtered by role=trainer
  console.log('[Step 2] Querying Admin Users roster with role=trainer filter...');
  const listReq = new Request('http://localhost:3000/api/admin/users?role=trainer&page=1&limit=10');
  const listRes = await adminUsersGet(listReq);
  const listData = await listRes.json();

  const foundTrainer = listData.data.find((u) => u.email.toLowerCase() === trainerEmail.toLowerCase());
  if (!foundTrainer) {
    throw new Error(`❌ FAILED: Newly invited trainer ${trainerEmail} not found in trainer roster`);
  }
  console.log(`Found Trainer in Roster: ${foundTrainer.fullName} (${foundTrainer.email}), Role: ${foundTrainer.role}, Status: ${foundTrainer.status}`);
  console.log('✅ Step 2 Passed: Trainer is listed in Admin panel with role "trainer".\n');

  // Step 3: Invited Trainer accepts and logs in with that exact Gmail ID
  console.log(`[Step 3] Trainer authenticates with invited Gmail ID (${trainerEmail})...`);
  const authReq = new Request('http://localhost:3000/api/auth/me', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: trainerEmail }),
  });
  const authRes = await authMePost(authReq);
  const authData = await authRes.json();

  console.log('Auth Me Resolution:', authData);
  if (authData.role !== 'trainer') {
    throw new Error(`❌ FAILED: Expected auth role 'trainer', got '${authData.role}'`);
  }
  if (authData.redirectTo !== '/trainer/dashboard') {
    throw new Error(`❌ FAILED: Expected redirectTo '/trainer/dashboard', got '${authData.redirectTo}'`);
  }
  console.log('✅ Step 3 Passed: Authenticated with exact invited Gmail, resolved to "trainer" role and redirected to /trainer/dashboard.\n');

  // Step 4: Verify an unauthorized student email DOES NOT get trainer role
  const randomStudentEmail = 'student.stranger@gmail.com';
  console.log(`[Step 4] Testing unauthorized email (${randomStudentEmail})...`);
  const studentAuthReq = new Request('http://localhost:3000/api/auth/me', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: randomStudentEmail }),
  });
  const studentAuthRes = await authMePost(studentAuthReq);
  const studentAuthData = await studentAuthRes.json();

  console.log('Unauthorized Auth Resolution:', studentAuthData);
  if (studentAuthData.role !== 'student') {
    throw new Error(`❌ FAILED: Unauthorized user should resolve as 'student', got '${studentAuthData.role}'`);
  }
  console.log('✅ Step 4 Passed: Unauthorized email is prevented from accessing Trainer role and routed to Student dashboard.\n');

  console.log('🎉 ALL TRAINER INVITATION & ROLE RESOLUTION TESTS PASSED SUCCESSFULLY!');
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
