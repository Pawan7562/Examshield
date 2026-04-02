// debug-students-api.js - Debug students API 400 error
const axios = require('axios');

async function debugStudentsAPI() {
  console.log('🔍 Debugging Students API 400 Error...');
  
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
    
    // Step 2: Test students API with different parameters
    console.log('\n📊 Step 2: Test students API');
    
    const testCases = [
      { name: 'Basic Test', params: {} },
      { name: 'With Page', params: { page: 1, limit: 20 } },
      { name: 'With Search', params: { search: 'test' } },
      { name: 'With Filters', params: { isActive: true, department: 'CS' } },
      { name: 'All Params', params: { page: 1, limit: 10, search: 'john', isActive: true, department: 'IT', batch: '2026' } }
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
          message: studentsResponse.data.message,
          total: studentsResponse.data.data?.total,
          studentsCount: studentsResponse.data.data?.students?.length
        });
        
        if (studentsResponse.data.success) {
          console.log('🎉 Students API working!');
        }
        
      } catch (error) {
        console.error('❌ Students API Error:');
        if (error.response) {
          console.log('  - Status:', error.response.status);
          console.log('  - Message:', error.response.data?.message);
          console.log('  - Error:', error.response.data?.error);
          console.log('  - Request URL:', error.config?.url);
          console.log('  - Request Params:', error.config?.params);
          console.log('  - Request Headers:', JSON.stringify(error.config?.headers, null, 2));
        } else {
          console.log('  - Network Error:', error.message);
        }
      }
    }
    
    console.log('\n🎯 Students API Debug Complete');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugStudentsAPI();
