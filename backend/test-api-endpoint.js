// Test the actual API endpoint
const axios = require('axios');

async function testAPI() {
  try {
    console.log('🧪 Testing college login API endpoint...\n');
    
    const baseURL = 'http://localhost:5000/api';
    
    // Test the exact endpoint that's failing
    console.log('1. Testing POST /auth/college/login');
    console.log('URL:', baseURL + '/auth/college/login');
    
    const testData = {
      email: 'test@examshield.com',
      password: 'password123'
    };
    
    console.log('Request data:', testData);
    
    try {
      const response = await axios.post(baseURL + '/auth/college/login', testData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ API Response:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
    } catch (apiError) {
      console.log('❌ API Error:', apiError.message);
      if (apiError.response) {
        console.log('Status:', apiError.response.status);
        console.log('Error data:', apiError.response.data);
      }
    }
    
    // Test server health
    console.log('\n2. Testing server health...');
    try {
      const healthResponse = await axios.get(baseURL.replace('/api', ''), { timeout: 5000 });
      console.log('✅ Server is running');
    } catch (healthError) {
      console.log('❌ Server health check failed:', healthError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI();
