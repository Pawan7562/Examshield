const axios = require('../backend/node_modules/axios');

async function testParallelIndependence() {
  console.log('Testing simultaneous requests to both projects...');

  const [examRes, orderkareRes] = await Promise.all([
    axios.get('https://exam.nexifyforge.in/api/health'),
    axios.get('https://orderkare.co.in/api/v1/settings/public', {
      headers: { Host: 'orderkare.co.in' }
    })
  ]);

  console.log('✅ ExamShield Health:', examRes.status, examRes.data?.status);
  console.log('✅ OrderKare Settings API:', orderkareRes.status, 'OK');
}

testParallelIndependence().catch(e => console.error('Error:', e.response?.data || e.message));

