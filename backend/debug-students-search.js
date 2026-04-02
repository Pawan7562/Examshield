// debug-students-search.js - Debug students search 500 error
const axios = require('axios');

async function debugStudentsSearch() {
  console.log('🔍 Debugging Students Search 500 Error...');
  
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
    
    // Step 2: Test students API with the problematic search
    console.log('\n📊 Step 2: Test students API with search');
    
    const testCases = [
      { name: 'Basic Test', params: {} },
      { name: 'With Simple Search', params: { search: 'test' } },
      { name: 'With Email Search', params: { search: 'pawankumaryadav75628697@gmail.com' } },
      { name: 'With Encoded Search', params: { search: 'pawankumaryadav75628697%40gmail.com' } }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n🧪 Test Case ${i + 1}: ${testCase.name}`);
      console.log('  - Params:', JSON.stringify(testCase.params, null, 2));
      
      try {
        const studentsResponse = await axios.get('http://localhost:5000/api/admin/students', {
          params: testCase.params,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Response:', {
          status: studentsResponse.status,
          success: studentsResponse.data.success,
          message: studentsResponse.data.message
        });
        
      } catch (error) {
        console.error('❌ Students API Error:');
        if (error.response) {
          console.log('  - Status:', error.response.status);
          console.log('  - Message:', error.response.data?.message);
          console.log('  - Error:', error.response.data?.error);
          console.log('  - Request URL:', error.config?.url);
          console.log('  - Request Params:', error.config?.params);
          
          // Log full error for debugging
          if (error.response.status === 500) {
            console.log('  - Full Error:', JSON.stringify(error.response.data, null, 2));
          }
        } else {
          console.log('  - Network Error:', error.message);
        }
      }
    }
    
    console.log('\n🎯 Students Search Debug Complete');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugStudentsSearch();
