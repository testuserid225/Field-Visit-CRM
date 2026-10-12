import { generateSync } from '../backend/node_modules/otplib/dist/index.js';

const BASE = 'http://localhost:5000/api';

async function test2FA() {
  console.log('--- TESTING GOOGLE AUTHENTICATOR (TOTP) 2FA FLOW ---');

  // Step 1: Initial Login (First-time 2FA Setup)
  console.log('\n[1] Submitting email and password for Shaikh Tareq...');
  const res1 = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shaikhtareq@iqratechnology.com', password: 'tareq@123' })
  });
  const data1 = await res1.json();
  console.log('Login Response Status:', res1.status);
  console.log('Response payload:', {
    require2FASetup: data1.require2FASetup,
    require2FA: data1.require2FA,
    hasQRCode: !!data1.qrCodeUrl,
    hasSecretKey: !!data1.secretKey,
    hasTwoFactorToken: !!data1.twoFactorToken
  });

  if (!data1.require2FASetup && !data1.require2FA) {
    console.error('Expected require2FASetup or require2FA flag!');
    process.exit(1);
  }

  let code;
  if (data1.require2FASetup) {
    console.log('\n[2] Setting up 2FA: Secret key received:', data1.secretKey);
    console.log('QR Code generated length:', data1.qrCodeUrl?.length);
    code = generateSync({ secret: data1.secretKey });
  } else {
    console.log('\n[2] 2FA already set up. We need the current secret or test code.');
  }

  // Step 2: Verify 6-digit Code
  console.log('\n[3] Verifying 6-digit code from Google Authenticator:', code);
  const verifyRes = await fetch(`${BASE}/auth/verify-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      twoFactorToken: data1.twoFactorToken,
      code
    })
  });
  const verifyData = await verifyRes.json();
  console.log('Verification Status:', verifyRes.status);
  console.log('Verification Success:', verifyData.success);
  console.log('JWT Token Issued (first 25 chars):', verifyData.token?.substring(0, 25));
  console.log('User logged in:', verifyData.user?.name, 'Role:', verifyData.user?.role);

  if (!verifyData.success || !verifyData.token) {
    console.error('2FA Verification Failed!');
    process.exit(1);
  }

  // Step 3: Second Login (Should now ask for require2FA directly)
  console.log('\n[4] Testing subsequent login (Now 2FA is already active)...');
  const res2 = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shaikhtareq@iqratechnology.com', password: 'tareq@123' })
  });
  const data2 = await res2.json();
  console.log('Second Login require2FA:', data2.require2FA, 'require2FASetup:', data2.require2FASetup);
  if (!data2.require2FA) {
    console.error('Expected require2FA to be true on second login!');
    process.exit(1);
  }

  console.log('\n>>> GOOGLE AUTHENTICATOR 2FA BACKEND VALIDATION PASSED 100%! <<<');
}

test2FA().catch(err => {
  console.error('Error in test2FA:', err);
  process.exit(1);
});
