// Test CORS from frontend perspective
const axios = require('axios');

async function testCORS() {
  try {
    console.log('🌐 Testing CORS configuration...\n');
    
    const baseURL = 'http://localhost:5000/api';
    
    // Test with frontend-like headers
    console.log('1. Testing with frontend headers...');
    try {
      const response = await axios.post(baseURL + '/auth/college/login', {
        email: 'test@examshield.com',
        password: 'password123'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000',
          'Referer': 'http://localhost:3000/'
        },
        timeout: 10000
      });
      
      console.log('✅ CORS Test PASSED');
      console.log('Status:', response.status);
      console.log('Headers:', response.headers['access-control-allow-origin']);
      
    } catch (error) {
      console.log('❌ CORS Test FAILED:', error.message);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
      }
    }
    
    console.log('\n2. Testing OPTIONS request...');
    try {
      const optionsResponse = await axios.options(baseURL + '/auth/college/login', {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      console.log('✅ OPTIONS Request PASSED');
      console.log('Status:', optionsResponse.status);
      console.log('CORS Headers:', {
        'Access-Control-Allow-Origin': optionsResponse.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': optionsResponse.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': optionsResponse.headers['access-control-allow-headers']
      });
      
    } catch (optionsError) {
      console.log('❌ OPTIONS Request FAILED:', optionsError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCORS();
