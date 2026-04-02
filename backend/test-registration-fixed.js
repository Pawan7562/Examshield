// test-registration-fixed.js - Quick test of registration
const axios = require('axios');

async function testRegistration() {
  console.log('🧪 Testing Fixed Registration...');
  
  try {
    console.log('\n📊 Step 1: Test college registration');
    const registrationData = {
      name: 'Test College',
      email: 'testcollege@example.com',
      password: 'Test@123',
      collegeName: 'Test College Registration'
    };
    
    const registerResponse = await axios.post('http://localhost:5000/api/auth/college/register', registrationData);
    
    console.log('✅ Registration Response:', {
      status: registerResponse.status,
      success: registerResponse.data.success,
      message: registerResponse.data.message
    });
    
    if (registerResponse.data.success) {
      console.log('🎉 Registration working!');
      console.log('  - College ID:', registerResponse.data.data.user.id);
      console.log('  - College Name:', registerResponse.data.data.user.name);
      console.log('  - Access Token:', registerResponse.data.data.accessToken ? 'Generated' : 'Missing');
    } else {
      console.error('❌ Registration failed:', registerResponse.data);
    }
    
    console.log('\n📊 Step 2: Test login with new credentials');
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/college/login', {
        email: 'testcollege@example.com',
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
        console.log('  - Access Token:', loginResponse.data.data.accessToken ? 'Generated' : 'Missing');
      }
      
    } catch (loginError) {
      console.error('❌ Login failed:', loginError.response?.data || loginError.message);
    }
    
    console.log('\n🎯 Registration Test Complete');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testRegistration();
