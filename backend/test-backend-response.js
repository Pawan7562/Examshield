// test-backend-response.js - Test exact backend response structure
const axios = require('axios');

async function testBackendResponse() {
  console.log('🔍 Testing Backend Response Structure...');
  
  try {
    // Step 1: Get authentication token
    console.log('\n📊 Step 1: Get authentication token');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/college/login', {
      email: 'test@examshield.com',
      password: 'Test@123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }
    
    const accessToken = loginResponse.data.data.accessToken;
    console.log('✅ Access token obtained');
    
    // Step 2: Test students API and examine full response
    console.log('\n📊 Step 2: Test students API');
    
    try {
      const studentsResponse = await axios.get('http://localhost:5000/api/admin/students', {
        params: { page: 1, limit: 20 },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Full Response Structure:');
      console.log('  - Status:', studentsResponse.status);
      console.log('  - Status Text:', studentsResponse.statusText);
      console.log('  - Headers:', JSON.stringify(studentsResponse.headers, null, 2));
      console.log('  - Full Data:', JSON.stringify(studentsResponse.data, null, 2));
      console.log('  - Success:', studentsResponse.data.success);
      console.log('  - Message:', studentsResponse.data.message);
      
      if (studentsResponse.data.data) {
        console.log('  - Data.students:', studentsResponse.data.data.students);
        console.log('  - Data.total:', studentsResponse.data.data.total);
        console.log('  - Data.pagination:', studentsResponse.data.data.pagination);
      }
      
    } catch (error) {
      console.error('❌ Students API Error:');
      if (error.response) {
        console.log('  - Status:', error.response.status);
        console.log('  - Message:', error.response.data?.message);
        console.log('  - Error:', error.response.data?.error);
        console.log('  - Full Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('  - Network Error:', error.message);
      }
    }
    
    console.log('\n🎯 Backend Response Test Complete');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testBackendResponse();
