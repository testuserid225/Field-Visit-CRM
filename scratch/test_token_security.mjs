async function testTokenSecurity() {
  try {
    console.log('=== TEST 1: Accessing protected route WITHOUT token ===');
    const noTokenRes = await fetch('http://localhost:5000/api/daily-visit-expenses');
    const noTokenData = await noTokenRes.json();
    console.log('Status without token:', noTokenRes.status);
    console.log('Message:', noTokenData.message);
    if (noTokenRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized but got ${noTokenRes.status}`);
    }
    console.log('✅ Unauthenticated access correctly blocked (401)!');

    console.log('\n=== TEST 2: Logging in as Shaikh Tareq (System Administrator) ===');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'shaikhtareq@iqratechnology.com', password: 'tareq@123' })
    });
    const loginData = await loginRes.json();
    console.log('Login success:', loginData.success);
    console.log('Token exists:', !!loginData.token);
    console.log('User details from login:', {
      name: loginData.user?.name,
      department: loginData.user?.department,
      designation: loginData.user?.designation,
      branch: loginData.user?.branch,
      role: loginData.user?.role
    });

    const adminToken = loginData.token;

    console.log('\n=== TEST 3: Accessing protected route WITH valid token ===');
    const authRes = await fetch('http://localhost:5000/api/daily-visit-expenses', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const authData = await authRes.json();
    console.log('Status with token:', authRes.status);
    console.log('Data success:', authData.success, 'Count:', authData.count);
    if (authRes.status !== 200 || !authData.success) {
      throw new Error(`Expected 200 OK but got ${authRes.status}`);
    }
    console.log('✅ Authenticated access succeeded with token (200)!');

    console.log('\n=== TEST 4: Logging in as field user Shaikh Talha (Service Engineer) ===');
    const talhaRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'iqratareq@gmail.com', password: 'tareq@123' })
    });
    const talhaLogin = await talhaRes.json();
    const talhaToken = talhaLogin.token;
    console.log('Shaikh Talha logged in. Role:', talhaLogin.user?.designation);

    console.log('\n=== TEST 5: Role-based Guard - Field user attempting Manager Inbox ===');
    const forbiddenRes = await fetch('http://localhost:5000/api/daily-visit-expenses/inbox', {
      headers: { 'Authorization': `Bearer ${talhaToken}` }
    });
    const forbiddenData = await forbiddenRes.json();
    console.log('Status for field user hitting manager inbox:', forbiddenRes.status);
    console.log('Message:', forbiddenData.message);
    if (forbiddenRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-manager but got ${forbiddenRes.status}`);
    }
    console.log('✅ Role-based guard blocked non-manager correctly (403)!');

    console.log('\n=== TEST 6: Manager Shaikh Anwar (Branch Manager) accessing Inbox ===');
    const anwarRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'anwar43131608@gmail.com', password: 'tareq@123' })
    });
    const anwarLogin = await anwarRes.json();
    const anwarToken = anwarLogin.token;

    const managerInboxRes = await fetch('http://localhost:5000/api/daily-visit-expenses/inbox?branch=Aurangabad%20Central', {
      headers: { 'Authorization': `Bearer ${anwarToken}` }
    });
    const managerInbox = await managerInboxRes.json();
    console.log('Status for Branch Manager hitting inbox:', managerInboxRes.status);
    console.log('Reports for BM:', managerInbox.count, 'Stats:', managerInbox.stats);
    if (managerInboxRes.status !== 200 || !managerInbox.success) {
      throw new Error(`Expected 200 OK for Branch Manager but got ${managerInboxRes.status}`);
    }
    console.log('✅ Branch Manager successfully accessed Approval Inbox!');

    console.log('\n🎉 ALL TOKEN-BASED SECURITY TESTS PASSED 100%!');
    process.exit(0);
  } catch (err) {
    console.error('❌ SECURITY TEST FAILED:', err);
    process.exit(1);
  }
}

testTokenSecurity();
