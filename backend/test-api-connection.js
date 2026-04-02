// test-api-connection.js - Test API connection after restart
const http = require('http');

async function testAPIConnection() {
  console.log('🔍 TESTING API CONNECTION');
  console.log('=====================================');

  try {
    // Test basic API endpoint
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      console.log('📊 API Response Status:', res.statusCode);
      console.log('📊 API Response Headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 API Response Body:', data);
        console.log('✅ API connection successful!');
      });
    });

    req.on('error', (error) => {
      console.error('❌ API connection error:', error.message);
    });

    req.on('timeout', () => {
      console.error('❌ API connection timeout');
      req.destroy();
    });

    req.end();

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testAPIConnection();
