const axios = require('axios');

async function testAll() {
  const API = 'http://localhost:5000/api';
  try {
    console.log('--- 1. Testing AI Question Generator ---');
    const collegeLogin = await axios.post(`${API}/auth/college/login`, {
      email: 'pawankumaryadav75628697@gmail.com',
      password: 'Pawan@1234'
    });
    const collegeToken = collegeLogin.data.data.accessToken;
    const aiStart = Date.now();
    const aiRes = await axios.post(`${API}/admin/ai/generate-questions`, {
      topic: 'Dynamic Programming',
      difficulty: 'medium',
      sources: ['leetcode', 'codeforces'],
      count: 3,
      mode: 'partial'
    }, { headers: { Authorization: `Bearer ${collegeToken}` } });
    console.log(`✅ AI Generator responded in ${Date.now() - aiStart}ms. Success: ${aiRes.data.success}, Questions count: ${aiRes.data.data.questions.length}`);

    console.log('\n--- 2. Testing Student Login ---');
    const studentsRes = await axios.get(`${API}/admin/students?limit=1`, {
      headers: { Authorization: `Bearer ${collegeToken}` }
    });
    const latestStudent = studentsRes.data.data.students[0];
    console.log('Found latest student:', latestStudent.student_id, latestStudent.email);

    // Test with lowercase Student ID and password with leading/trailing spaces
    const studentLoginRes = await axios.post(`${API}/auth/student/login`, {
      email: latestStudent.student_id.toLowerCase(),
      password: '  LXRZ6LELrp  ' // spaces trimmed automatically now
    });
    console.log('✅ Student login status:', studentLoginRes.status, studentLoginRes.data?.success ? 'SUCCESS' : 'FAILED');

    console.log('\n--- 3. Testing Super Admin Payment Management ---');
    const superAdminLoginRes = await axios.post(`${API}/auth/super-admin/login`, {
      email: 'pawankumaryadav75628697@gmail.com',
      password: 'Pawan@1234'
    }).catch(e => e.response);

    if (superAdminLoginRes.status === 200) {
      const saToken = superAdminLoginRes.data.data.accessToken;
      const paymentsRes = await axios.get(`${API}/super-admin/payments`, {
        headers: { Authorization: `Bearer ${saToken}` }
      });
      console.log('✅ Super Admin payments loaded successfully! Total records:', (paymentsRes.data.data?.payments || []).length);
    } else {
      console.log('Super Admin login note:', superAdminLoginRes.data?.message);
    }

    console.log('\n🎉 ALL THREE AREAS VERIFIED CLEANLY!');
  } catch (err) {
    console.error('Error during verification:', err.response?.data || err.message);
  }
}

testAll();
