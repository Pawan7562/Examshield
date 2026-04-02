// debug-auth-401.js - Debug 401 authentication error
const axios = require('axios');

async function debugAuth401() {
  console.log('🔍 Debugging 401 Authentication Error...');
  
  try {
    // Step 1: Test login with exact credentials
    console.log('\n📊 Step 1: Test login');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/college/login', {
      email: 'test@examshield.com',
      password: 'Test@123'
    });
    
    console.log('✅ Login Response:', {
      status: loginResponse.status,
      success: loginResponse.data.success,
      message: loginResponse.data.message,
      data: loginResponse.data.data
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return null;
    }
    
    const accessToken = loginResponse.data.data.accessToken;
    console.log('✅ Access token obtained:', accessToken ? 'YES' : 'NO');
    
    // Step 2: Test token by calling protected endpoint
    console.log('\n📊 Step 2: Test protected endpoint');
    try {
      const testResponse = await axios.get('http://localhost:5000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Protected Endpoint Response:', {
        status: testResponse.status,
        success: testResponse.data.success
      });
      
    } catch (testError) {
      console.error('❌ Protected Endpoint Error:', {
        status: testError.response?.status,
        message: testError.response?.data?.message,
        error: testError.response?.data?.error
      });
    }
    
    console.log('\n🎯 Authentication Debug Complete');
    return accessToken;
    
  } catch (error) {
    console.error('❌ Authentication debug error:', error);
    return null;
  }
}

debugAuth401();
