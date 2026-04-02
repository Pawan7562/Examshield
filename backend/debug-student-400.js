// debug-student-400.js - Debug 400 error in student addition
const axios = require('axios');

async function debugStudent400Error() {
  console.log('🔍 Debugging 400 Bad Request Error...');
  
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
    
    // Step 2: Test different student data scenarios
    console.log('\n📊 Step 2: Test student data validation');
    
    const testCases = [
      {
        name: 'Test Student',
        email: 'teststudent@example.com',
        roll_no: 'TEST001',
        department: 'CS',
        batch: '2026'
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        roll_no: 'ROLL001',
        department: 'Computer Science',
        batch: '2026'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        roll_no: 'ROLL002',
        department: 'IT',
        batch: '2026'
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n🧪 Test Case ${i + 1}:`, testCase);
      
      try {
        const addStudentResponse = await axios.post('http://localhost:5000/api/admin/students', testCase, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Response:', {
          status: addStudentResponse.status,
          success: addStudentResponse.data.success,
          message: addStudentResponse.data.message
        });
        
        if (addStudentResponse.data.success) {
          console.log('🎉 Student added successfully!');
        }
        
      } catch (error) {
        console.error('❌ Error:', {
          status: error.response?.status,
          message: error.response?.data?.message,
          error: error.response?.data?.error,
          data: error.response?.data
        });
        
        // Log detailed error info
        if (error.response?.status === 400) {
          console.log('🔍 400 Error Details:');
          console.log('  - Request Data:', JSON.stringify(testCase, null, 2));
          console.log('  - Response Headers:', error.response?.headers);
          console.log('  - Response Data:', JSON.stringify(error.response?.data, null, 2));
        }
      }
    }
    
    console.log('\n🎯 Debug Complete');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugStudent400Error();
