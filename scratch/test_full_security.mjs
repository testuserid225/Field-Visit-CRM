// Comprehensive security test suite
const BASE = 'http://localhost:5000/api';

async function runSecurityTests() {
  console.log('--- STARTING COMPREHENSIVE SECURITY AUDIT ---');

  // Test 1: Employee login
  console.log('\n[1] Testing Employee Login (Shaikh Tareq)...');
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shaikhtareq@iqratechnology.com', password: 'tareq@123' })
  });
  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status, 'Success:', loginData.success);
  if (!loginData.success || !loginData.token) {
    console.error('Login failed!', loginData);
    process.exit(1);
  }
  const token = loginData.token;
  console.log('Token received (starts with):', token.substring(0, 25) + '...');

  // Test 2: Verify /me profile
  console.log('\n[2] Testing Token Profile Validation (/api/auth/me)...');
  const meRes = await fetch(`${BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await meRes.json();
  console.log('Me Status:', meRes.status, 'User Name:', meData.user?.name, 'Role:', meData.user?.role);
  if (!meData.success || !meData.user) {
    console.error('Me endpoint failed!');
    process.exit(1);
  }

  // Test 3: Password Exclusion Audit in Employee API
  console.log('\n[3] Testing Password Leak Prevention on /api/employees...');
  const empRes = await fetch(`${BASE}/employees`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const empData = await empRes.json();
  console.log('Employees Status:', empRes.status, 'Count:', empData.count);
  const anyPasswordLeaked = empData.employees.some(e => e.accountPassword !== undefined);
  if (anyPasswordLeaked) {
    console.error('SECURITY VULNERABILITY: accountPassword was found in employee response!');
    process.exit(1);
  } else {
    console.log('PASS: accountPassword is NEVER leaked in employee queries.');
  }

  // Test 4: Password Exclusion in Auth Users
  console.log('\n[4] Testing Password Leak Prevention on /api/auth/users...');
  const usersRes = await fetch(`${BASE}/auth/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const usersData = await usersRes.json();
  console.log('Users Status:', usersRes.status, 'Count:', usersData.count);
  const anyUserPassLeaked = usersData.users.some(u => u.password !== undefined);
  if (anyUserPassLeaked) {
    console.error('SECURITY VULNERABILITY: password was found in user response!');
    process.exit(1);
  } else {
    console.log('PASS: User password is NEVER leaked in user queries.');
  }

  // Test 5: Verify Unauthenticated Access is Blocked
  console.log('\n[5] Testing Unauthenticated Access Rejection...');
  const unauthRes = await fetch(`${BASE}/daily-visit-expenses`);
  console.log('Unauthenticated Status:', unauthRes.status);
  if (unauthRes.status === 401) {
    console.log('PASS: Unauthenticated access strictly blocked with 401.');
  } else {
    console.error('FAIL: Unauthenticated access was NOT blocked!');
    process.exit(1);
  }

  // Test 6: Verify Regular Field Employee Data Isolation
  console.log('\n[6] Testing Field Employee Login & Role-based Data Isolation (Shaikh Talha - Service Engineer)...');
  const empLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'iqratareq@gmail.com', password: 'tareq@123' })
  });
  const empLoginData = await empLoginRes.json();
  console.log('Field Employee Login:', empLoginRes.status, 'Success:', empLoginData.success, 'Name:', empLoginData.user?.name, 'Role:', empLoginData.user?.role);
  const empToken = empLoginData.token;

  // Regular employee attempting to view expenses
  const empExpRes = await fetch(`${BASE}/daily-visit-expenses`, {
    headers: { 'Authorization': `Bearer ${empToken}` }
  });
  const empExpData = await empExpRes.json();
  console.log('Field Employee Own Expenses Count:', empExpData.count);

  // Regular employee attempting to access manager approval inbox
  const empInboxRes = await fetch(`${BASE}/daily-visit-expenses/inbox`, {
    headers: { 'Authorization': `Bearer ${empToken}` }
  });
  console.log('Field Employee Inbox Access Status:', empInboxRes.status);
  if (empInboxRes.status === 403) {
    console.log('PASS: Regular field employee strictly forbidden from approval inbox with 403 Forbidden.');
  } else {
    console.error('FAIL: Approval inbox was not forbidden for field employee! Status:', empInboxRes.status);
    process.exit(1);
  }

  // Test 7: Verify Branch Manager Access (Shaikh Anwar)
  console.log('\n[7] Testing Branch Manager Access (Shaikh Anwar)...');
  const mgrLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'anwar43131608@gmail.com', password: 'tareq@123' })
  });
  const mgrLoginData = await mgrLoginRes.json();
  const mgrInboxRes = await fetch(`${BASE}/daily-visit-expenses/inbox`, {
    headers: { 'Authorization': `Bearer ${mgrLoginData.token}` }
  });
  console.log('Branch Manager Inbox Access Status:', mgrInboxRes.status);
  if (mgrInboxRes.status === 200) {
    console.log('PASS: Branch Manager granted access to approval inbox.');
  } else {
    console.error('FAIL: Branch Manager was denied access to approval inbox!');
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('>>> ALL 7 SECURITY AUDIT TESTS PASSED WITH 100% SUCCESS! <<<');
  console.log('======================================================');
}

runSecurityTests().catch(err => {
  console.error('Audit script error:', err);
  process.exit(1);
});
