// Test the fixed student addition
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function testFixedStudentAddition() {
  try {
    console.log('🔧 Testing Fixed Student Addition\n');
    
    const api = axios.create({
      baseURL: 'http://localhost:5000/api',
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    
    // Add auth interceptor
    api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Login
    console.log('1. 🔐 Logging in as admin...');
    const loginResponse = await api.post('/auth/college/login', {
      email: 'test@examshield.com',
      password: 'password123'
    });
    
    const { accessToken } = loginResponse.data.data;
    localStorage.setItem('accessToken', accessToken);
    console.log('✅ Logged in');
    
    // Add student
    console.log('\n2. 👤 Adding student with fixed error handling...');
    const uniqueEmail = `fixed${Date.now()}@examshield.com`;
    const uniqueRollNo = 'FIX' + Date.now().toString().slice(-6);
    
    try {
      const addResponse = await api.post('/admin/students', {
        name: 'Fixed Test Student',
        email: uniqueEmail,
        rollNo: uniqueRollNo
      });
      
      console.log('✅ Student added successfully!');
      console.log('Response:', JSON.stringify(addResponse.data, null, 2));
      
      if (addResponse.data.success) {
        console.log('\n🎓 STUDENT CREDENTIALS:');
        console.log('Name:', addResponse.data.data.name);
        console.log('Email:', addResponse.data.data.email);
        console.log('Student ID:', addResponse.data.data.student_id);
        console.log('Password:', addResponse.data.data.password);
        console.log('Roll No:', addResponse.data.data.roll_no);
        console.log('\n📧 Email should be sent to:', addResponse.data.data.email);
      }
      
    } catch (addError) {
      console.log('❌ Student addition failed:');
      console.log('Status:', addError.response?.status);
      console.log('Error:', addError.response?.data);
      
      if (addError.response?.data?.error?.includes('Cannot read properties of undefined')) {
        console.log('🔧 This is the error we fixed!');
        console.log('🔧 If you still see this, the fix needs adjustment');
      }
    }
    
    console.log('\n3. 🎯 Test Results:');
    console.log('✅ If student added successfully → Error fixed');
    console.log('❌ If "Cannot read properties of undefined" → Need more fixes');
    console.log('✅ Email should be sent to student automatically');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFixedStudentAddition();
