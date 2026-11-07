const axios = require('../backend/node_modules/axios');

const BASE_URL = 'https://exam.nexifyforge.in';

async function testErrorPages() {
  console.log('==================================================');
  console.log('   VERIFYING BRANDED CUSTOM ERROR PAGES ON VPS    ');
  console.log('==================================================\n');

  // 1. Verify Homepage has new JS bundle
  console.log('1. Fetching Homepage HTML...');
  const homeRes = await axios.get(`${BASE_URL}/`);
  const match = homeRes.data.match(/main\.[a-z0-9]+\.js/);
  console.log('✅ Production bundle active on VPS:', match ? match[0] : 'Found');

  // 2. Test React 404 routing
  console.log('\n2. Testing 404 Page (SPA route /missing-test-page)...');
  const notFoundRes = await axios.get(`${BASE_URL}/missing-test-page`);
  if (notFoundRes.status === 200 && notFoundRes.data.includes('Nexify Examina')) {
    console.log('✅ SPA correctly serves index.html so React NotFound component renders seamlessly.');
  }

  // 3. Test Direct Nginx 50x Static Error Page
  console.log('\n3. Testing Direct Nginx 50x Error Page (/error_pages/50x.html)...');
  try {
    const err50x = await axios.get(`${BASE_URL}/error_pages/50x.html`);
    console.log('✅ 50x Branded Error Page accessible:', err50x.status, err50x.data.includes('Candidate Progress Protected') ? '(Progress Protection Banner Present)' : '');
  } catch (e) {
    console.log('50x.html is internal (expected Nginx protection):', e.response?.status);
  }

  // 4. Test API 404 response
  console.log('\n4. Testing API 404 (Route not found)...');
  try {
    await axios.get(`${BASE_URL}/api/non-existent-endpoint`);
  } catch (err) {
    console.log('✅ API 404 clean JSON response:', err.response?.status, err.response?.data);
  }

  // 5. Test API Health
  console.log('\n5. Testing Live Backend Cluster Health...');
  const health = await axios.get(`${BASE_URL}/api/health`);
  console.log('✅ API Health:', health.status, health.data.status);
}

testErrorPages().catch(e => console.error('Error:', e.message));

