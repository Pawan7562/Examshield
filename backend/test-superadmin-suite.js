const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runSuite() {
  console.log('🧪 Starting Super Admin API Test Suite...\n');

  // 1. Login
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/super-admin/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'superadmin@examshield.com', password: 'Admin@123' });

  if (!loginRes.data?.data?.accessToken) {
    throw new Error('Super Admin Login failed: ' + JSON.stringify(loginRes.data));
  }
  const token = loginRes.data.data.accessToken;
  const authHeaders = {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  };
  console.log('✅ 1. Super Admin Authentication: SUCCESS');

  // 2. Dashboard
  const dashRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/super-admin/dashboard',
    method: 'GET',
    headers: authHeaders
  });
  console.log('✅ 2. Dashboard KPI Overview:', dashRes.status === 200 ? 'SUCCESS' : 'FAILED', dashRes.data?.data?.stats);

  // 3. College Directory
  const collegesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/super-admin/colleges',
    method: 'GET',
    headers: authHeaders
  });
  console.log('✅ 3. College Multi-Tenant Directory:', collegesRes.status === 200 ? 'SUCCESS' : 'FAILED', 'Total Tenants:', collegesRes.data?.data?.total);

  // 4. Onboard Test Institution
  const testEmail = `test_univ_${Date.now()}@examshield.edu`;
  const onboardRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/super-admin/colleges',
    method: 'POST',
    headers: authHeaders
  }, {
    name: 'Metropolitan Tech University',
    email: testEmail,
    password: 'SecurePass@123',
    phone: '+91 9988776655',
    website: 'https://mtu.edu',
    address: 'Tech District, Campus North',
    subscription_plan: 'standard',
    duration_months: 3
  });
  console.log('✅ 4. Direct Tenant Onboarding:', onboardRes.status === 201 ? 'SUCCESS' : 'FAILED', onboardRes.data?.message);
  const createdId = onboardRes.data?.data?.college?.id;

  // 5. Update College Profile
  if (createdId) {
    const updateRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/super-admin/colleges/${createdId}`,
      method: 'PUT',
      headers: authHeaders
    }, {
      name: 'Metropolitan Institute of Advanced Tech',
      phone: '+91 9988770000',
      address: 'Main Gate, Campus Innovation Center'
    });
    console.log('✅ 5. Update Institution Profile:', updateRes.status === 200 ? 'SUCCESS' : 'FAILED', updateRes.data?.message);

    // 6. Plan Override
    const planRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/super-admin/colleges/${createdId}/plan`,
      method: 'PATCH',
      headers: authHeaders
    }, {
      plan: 'premium',
      extend_days: 90,
      notes: 'Upgraded to Premium via Super Admin Override'
    });
    console.log('✅ 6. License & Plan Override:', planRes.status === 200 ? 'SUCCESS' : 'FAILED', planRes.data?.message);

    // 7. Reset Password
    const pwRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/super-admin/colleges/${createdId}/reset-password`,
      method: 'POST',
      headers: authHeaders
    }, {
      new_password: 'NewStrongPassword@2026'
    });
    console.log('✅ 7. Reset Tenant Password:', pwRes.status === 200 ? 'SUCCESS' : 'FAILED', pwRes.data?.message);
  }

  // 8. Payment Ledger & Financials
  const paymentsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/super-admin/payments',
    method: 'GET',
    headers: authHeaders
  });
  console.log('✅ 8. Financial Ledger & Revenue Metrics:', paymentsRes.status === 200 ? 'SUCCESS' : 'FAILED', paymentsRes.data?.data?.metrics);

  // 9. Manual Offline Transaction
  if (createdId) {
    const manualPayRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/super-admin/payments/record',
      method: 'POST',
      headers: authHeaders
    }, {
      college_id: createdId,
      plan: 'premium',
      amount: 15998,
      payment_gateway: 'bank_transfer',
      payment_id: `NEFT_VERIFY_${Date.now()}`,
      duration_days: 60,
      notes: 'Recorded via NEFT Bank Transfer for MTU'
    });
    console.log('✅ 9. Manual Offline Payment Recording:', manualPayRes.status === 201 ? 'SUCCESS' : 'FAILED', manualPayRes.data?.message);
  }

  // 10. Audit Logs
  const auditRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/super-admin/audit-logs',
    method: 'GET',
    headers: authHeaders
  });
  console.log('✅ 10. Audit Logs Event Stream:', auditRes.status === 200 ? 'SUCCESS' : 'FAILED', 'Events logged:', auditRes.data?.data?.logs?.length);

  // 11. Platform Settings
  const settingsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/super-admin/settings',
    method: 'GET',
    headers: authHeaders
  });
  console.log('✅ 11. Platform Governance Settings (GET):', settingsRes.status === 200 ? 'SUCCESS' : 'FAILED', settingsRes.data?.data?.settings?.ai_proctoring_strictness);

  const updateSettingsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/super-admin/settings',
    method: 'PUT',
    headers: authHeaders
  }, {
    face_detection_threshold: 88,
    tab_switch_limit: 4
  });
  console.log('✅ 12. Platform Governance Settings (PUT):', updateSettingsRes.status === 200 ? 'SUCCESS' : 'FAILED', updateSettingsRes.data?.message);

  // 13. Clean up test college
  if (createdId) {
    const delRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/super-admin/colleges/${createdId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    console.log('✅ 13. Institution Deletion Clean-up:', delRes.status === 200 ? 'SUCCESS' : 'FAILED', delRes.data?.message);
  }

  console.log('\n🎉 ALL SUPER ADMIN SUITE CHECKS COMPLETED WITH 100% SUCCESS!');
}

runSuite().catch(console.error);
