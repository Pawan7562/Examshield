// test-login-endpoint.js - Test the login endpoint directly
const axios = require('axios');

async function testLoginEndpoint() {
  console.log('🧪 Testing Login Endpoint Directly...');
  
  try {
    // Test the login endpoint with correct credentials
    const loginData = {
      email: 'test@examshield.com',
      password: 'Test@123'
    };
    
    console.log('📊 Sending login request...');
    console.log('🔗 URL: http://localhost:5000/api/auth/college/login');
    console.log('📧 Email:', loginData.email);
    console.log('🔑 Password:', loginData.password);
    
    const response = await axios.post('http://localhost:5000/api/auth/college/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', response.data);
    
  } catch (error) {
    console.error('❌ Login failed:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📊 Status Text:', error.response.statusText);
      console.log('📊 Response data:', error.response.data);
    } else if (error.request) {
      console.log('❌ No response from server:', error.message);
    } else {
      console.log('❌ Request error:', error.message);
    }
  }
}

testLoginEndpoint();
