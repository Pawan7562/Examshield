const axios = require('../backend/node_modules/axios');
const BASE_URL = 'https://exam.nexifyforge.in';

async function test() {
  const loginRes = await axios.post(`${BASE_URL}/api/auth/student/login`, {
    studentId: 'CGC26_0001',
    password: 'Candidate2026!'
  });
  const token = loginRes.data?.data?.accessToken;

  const cppRes = await axios.post(
    `${BASE_URL}/api/student/run-code`,
    {
      language: 'cpp',
      code: '#include <iostream>\nint main() { std::cout << "C++ OK" << std::endl; return 0; }',
      customInput: ' '
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('Keys in cppRes.data:', Object.keys(cppRes.data));
  console.log('Full cppRes.data:', JSON.stringify(cppRes.data, null, 2));
}
test().catch(e => console.error(e.response?.data || e.message));
