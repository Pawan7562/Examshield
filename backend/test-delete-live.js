require('dotenv').config();
const axios = require('axios');

const BASE = 'http://localhost:5000/api';
const STUDENT_ID = 'c54b191b-517c-47c1-a67b-a467d6da3a01';

async function run() {
  // Login
  let token;
  try {
    const res = await axios.post(`${BASE}/auth/college/login`, {
      email: 'pawankumaryadav75628697@gmail.com',
      password: 'Admin@123'
    });
    token = res.data?.data?.accessToken || res.data?.accessToken;
    console.log('✅ Login OK, token:', token?.substring(0, 20) + '...');
  } catch (e) {
    console.error('❌ Login failed:', e.response?.data || e.message);
    console.log('Trying password: pawan@123...');
    try {
      const res2 = await axios.post(`${BASE}/auth/college/login`, {
        email: 'pawankumaryadav75628697@gmail.com',
        password: 'pawan@123'
      });
      token = res2.data?.data?.accessToken || res2.data?.accessToken;
      console.log('✅ Login OK with pawan@123');
    } catch (e2) {
      console.error('❌ Login failed again:', e2.response?.data || e2.message);
      return;
    }
  }

  if (!token) {
    console.error('❌ No token obtained');
    return;
  }

  // Try DELETE
  try {
    const delRes = await axios.delete(`${BASE}/admin/students/${STUDENT_ID}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ DELETE SUCCESS:', delRes.data);
  } catch (e) {
    console.error('❌ DELETE FAILED:');
    console.error('  Status:', e.response?.status);
    console.error('  Data:', JSON.stringify(e.response?.data, null, 2));
    console.error('  Message:', e.message);
  }
}

run();
