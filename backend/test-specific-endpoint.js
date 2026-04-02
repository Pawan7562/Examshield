// test-specific-endpoint.js - Test specific API endpoints
const http = require('http');

async function testSpecificEndpoints() {
  console.log('🔍 TESTING SPECIFIC API ENDPOINTS');
  console.log('=====================================');

  const endpoints = [
    '/api/admin/exams',
    '/api/admin/exams/test-id/questions',
    '/api/student/exams'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint}`);
    
    try {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: endpoint,
        method: 'GET',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        console.log(`  📊 Status: ${res.statusCode}`);
        console.log(`  📊 Headers: ${JSON.stringify(res.headers, null, 2)}`);
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`  📊 Response: ${data.substring(0, 200)}...`);
          console.log(`  ✅ ${endpoint} - Working`);
        });
      });

      req.on('error', (error) => {
        console.error(`  ❌ ${endpoint} - Error: ${error.message}`);
      });

      req.on('timeout', () => {
        console.error(`  ❌ ${endpoint} - Timeout`);
        req.destroy();
      });

      req.end();

      // Wait for response before next test
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`  ❌ ${endpoint} - Exception: ${error.message}`);
    }
  }

  console.log('\n✅ Endpoint testing complete');
}

// Run the test
testSpecificEndpoints();
