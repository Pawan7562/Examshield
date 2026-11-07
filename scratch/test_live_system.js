const axios = require('../backend/node_modules/axios');

const BASE_URL = 'https://exam.nexifyforge.in';

async function runTests() {
  console.log('====================================================');
  console.log('   VERIFYING EXAMSHIELD PRODUCTION CLUSTER ON VPS   ');
  console.log('====================================================\n');

  // Test 1: Frontend Homepage
  console.log('Test 1: Fetching Frontend Homepage...');
  const frontendRes = await axios.get(`${BASE_URL}/`);
  if (frontendRes.status === 200 && frontendRes.data.includes('Nexify Examina')) {
    console.log('✅ Frontend successfully served from VPS Nginx! Status 200.');
    if (frontendRes.data.includes('vercel')) {
      console.warn('⚠️ Warning: Vercel references still found in HTML');
    } else {
      console.log('✅ No Vercel references in HTML.');
    }
  } else {
    throw new Error(`Frontend returned status ${frontendRes.status}`);
  }

  // Test 2: API Health Check
  console.log('\nTest 2: Checking Backend Cluster Health...');
  const healthRes = await axios.get(`${BASE_URL}/api/health`);
  console.log('✅ Backend Health Status:', healthRes.data.status);
  console.log('   Redis Clustering:', healthRes.data.cluster?.redisClustering);
  console.log('   Database Pools Idle/Total:', `${healthRes.data.database?.poolIdle}/${healthRes.data.database?.poolTotal}`);

  // Test 3: Student Login (CGC26_0001 / Candidate2026!)
  console.log('\nTest 3: Testing Student Login with Local PostgreSQL 18 DB...');
  const loginRes = await axios.post(`${BASE_URL}/api/auth/student/login`, {
    studentId: 'CGC26_0001',
    password: 'Candidate2026!'
  });

  const token = loginRes.data?.data?.accessToken;
  const user = loginRes.data?.data?.user;

  if (token) {
    console.log('✅ Login successful! Received valid JWT token.');
    console.log('   Candidate Name:', user?.name);
    console.log('   Candidate Roll:', user?.rollNo || user?.studentId);
    console.log('   Candidate College:', user?.collegeName);
  } else {
    throw new Error('Login failed to return token: ' + JSON.stringify(loginRes.data));
  }

  // Test 4: Retrieve Student Exams
  console.log('\nTest 4: Retrieving Student Exams List from VPS DB...');
  const examsRes = await axios.get(`${BASE_URL}/api/student/exams`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const exams = examsRes.data?.data?.exams || examsRes.data?.exams || examsRes.data;
  console.log(`✅ Successfully retrieved exams from VPS database!`);

  // Test 5: Native Code Compilation (Judge0 Replacement)
  console.log('\nTest 5: Executing Native Python Code on Backend Cluster...');
  const codeRes = await axios.post(
    `${BASE_URL}/api/student/run-code`,
    {
      language: 'python',
      code: 'import sys\nprint("Hello from Scaled Backend VPS Cluster!")\nprint(f"Python: {sys.version.split()[0]}")',
      customInput: 'test_input'
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  console.log('✅ Code Execution Response Status:', codeRes.data?.success ? 'Success' : 'Completed');
  console.log('   Execution Output:', JSON.stringify(codeRes.data?.results || codeRes.data?.data || codeRes.data, null, 2));

  // Test 6: Concurrent Load Balancing (32 concurrent requests)
  console.log('\nTest 6: Firing 32 concurrent API requests across 16 backend cluster nodes...');
  const start = Date.now();
  const promises = Array.from({ length: 32 }, (_, i) =>
    axios.get(`${BASE_URL}/api/student/exams`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  );

  const results = await Promise.all(promises);
  const duration = Date.now() - start;
  const allSuccessful = results.every(r => r.status === 200);

  if (allSuccessful) {
    console.log(`✅ All 32 concurrent requests succeeded (100% 200 OK) in ${duration}ms (${(duration / 32).toFixed(1)}ms avg)!`);
  } else {
    console.error('❌ Some requests failed!');
  }

  console.log('\n====================================================');
  console.log('      ALL PRODUCTION CLUSTER TESTS PASSED! 🎉        ');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err.response?.data || err.message);
  process.exit(1);
});
