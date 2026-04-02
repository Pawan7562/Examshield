// test-student-addition.js - Test student addition API
const axios = require('axios');

async function testStudentAddition() {
  console.log('🧪 Testing Student Addition API...');
  
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
    
    // Step 2: Test student addition
    console.log('\n📊 Step 2: Test student addition');
    const studentData = {
      name: 'Test Student',
      email: 'teststudent@examshield.com',
      roll_no: 'TEST001',
      department: 'Computer Science',
      batch: '2026'
    };
    
    try {
      const addStudentResponse = await axios.post('http://localhost:5000/api/admin/students', studentData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Student Addition Response:');
      console.log('  - Status:', addStudentResponse.status);
      console.log('  - Success:', addStudentResponse.data.success);
      console.log('  - Message:', addStudentResponse.data.message);
      
      if (addStudentResponse.data.success) {
        console.log('🎉 Student added successfully!');
        console.log('  - Student ID:', addStudentResponse.data.data.student_id);
        console.log('  - Password:', addStudentResponse.data.data.password);
      }
      
    } catch (addStudentError) {
      console.error('❌ Student Addition Error:');
      if (addStudentError.response) {
        console.log('  - Status:', addStudentError.response.status);
        console.log('  - Message:', addStudentError.response.data?.message);
        console.log('  - Error:', addStudentError.response.data?.error);
      } else {
        console.log('  - Network Error:', addStudentError.message);
      }
    }
    
    // Step 3: Test student listing
    console.log('\n📊 Step 3: Test student listing');
    try {
      const listStudentsResponse = await axios.get('http://localhost:5000/api/admin/students', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Student Listing Response:');
      console.log('  - Status:', listStudentsResponse.status);
      console.log('  - Success:', listStudentsResponse.data.success);
      console.log('  - Total Students:', listStudentsResponse.data.data?.total);
      
    } catch (listStudentsError) {
      console.error('❌ Student Listing Error:');
      if (listStudentsError.response) {
        console.log('  - Status:', listStudentsError.response.status);
        console.log('  - Message:', listStudentsError.response.data?.message);
        console.log('  - Error:', listStudentsError.response.data?.error);
      } else {
        console.log('  - Network Error:', listStudentsError.message);
      }
    }
    
    console.log('\n🎯 Student Addition Test Complete');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testStudentAddition();
