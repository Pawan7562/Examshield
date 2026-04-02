// test-frontend-simulation.js - Simulate exact frontend request
const http = require('http');

async function testFrontendSimulation() {
  console.log('🔍 SIMULATING FRONTEND REQUEST');
  console.log('=====================================');

  try {
    // Simulate the exact request the frontend would make
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/exams',
      method: 'GET',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    console.log('📡 Sending request to backend...');
    console.log('📊 Request details:', {
      hostname: options.hostname,
      port: options.port,
      path: options.path,
      method: options.method,
      headers: options.headers
    });

    const startTime = Date.now();

    const req = http.request(options, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log('📊 Response received:');
      console.log(`  📊 Status: ${res.statusCode}`);
      console.log(`  📊 Response Time: ${responseTime}ms`);
      console.log(`  📊 Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`  📊 Response Body: ${data}`);
        console.log(`  ✅ Frontend simulation successful - Backend is reachable!`);
        
        if (res.statusCode === 401) {
          console.log(`  📝 Note: 401 is expected without authentication token`);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Frontend simulation error:', error.message);
      console.error('❌ Error details:', {
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        address: error.address,
        port: error.port
      });
      
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Backend is not running or not accepting connections');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('❌ Backend request timed out');
      }
    });

    req.on('timeout', () => {
      console.error('❌ Frontend simulation timeout');
      req.destroy();
    });

    req.end();

  } catch (error) {
    console.error('❌ Simulation exception:', error.message);
  }
}

// Run the test
testFrontendSimulation();
