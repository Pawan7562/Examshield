// debug-login-500.js - Debug login 500 error
const axios = require('axios');

async function debugLogin500() {
  console.log('🔍 Debugging Login 500 Error...');
  
  try {
    console.log('\n📊 Step 1: Test login with registered credentials');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/college/login', {
      email: 'pawankumaryadav75628697@gmail.com',
      password: 'Test@123'
    });
    
    console.log('✅ Login Response:', {
      status: loginResponse.status,
      success: loginResponse.data.success,
      message: loginResponse.data.message
    });
    
    if (loginResponse.data.success) {
      console.log('🎉 Login working!');
      console.log('  - User ID:', loginResponse.data.data.user.id);
      console.log('  - User Name:', loginResponse.data.data.user.name);
      console.log('  - Access Token:', loginResponse.data.data.accessToken ? 'Generated' : 'Missing');
    } else {
      console.error('❌ Login failed:', loginResponse.data);
    }
    
    console.log('\n📊 Step 2: Test with test@examshield.com credentials');
    try {
      const testLoginResponse = await axios.post('http://localhost:5000/api/auth/college/login', {
        email: 'test@examshield.com',
        password: 'Test@123'
      });
      
      console.log('✅ Test Login Response:', {
        status: testLoginResponse.status,
        success: testLoginResponse.data.success,
        message: testLoginResponse.data.message
      });
      
      if (testLoginResponse.data.success) {
        console.log('🎉 Test login working!');
      } else {
        console.error('❌ Test login failed:', testLoginResponse.data);
      }
      
    } catch (testError) {
      console.error('❌ Test login error:', testError.response?.data || testError.message);
    }
    
    console.log('\n🎯 Login Debug Complete');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugLogin500();
