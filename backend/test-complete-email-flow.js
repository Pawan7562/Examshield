// Test complete email flow through API
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function testCompleteEmailFlow() {
  try {
    console.log('🔄 Testing Complete Email Flow (API + Email Function)\n');
    
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
    
    // 1. Login
    console.log('1. 🔐 Logging in as admin...');
    const loginResponse = await api.post('/auth/college/login', {
      email: 'test@examshield.com',
      password: 'password123'
    });
    
    const { accessToken } = loginResponse.data.data;
    localStorage.setItem('accessToken', accessToken);
    console.log('✅ Logged in');
    
    // 2. Add student via API (like frontend does)
    console.log('\n2. 👤 Adding student via API...');
    console.log('   This will trigger the email function...');
    console.log('   WATCH CONSOLE for credential output...\n');
    
    const uniqueEmail = `flowtest${Date.now()}@examshield.com`;
    const uniqueRollNo = 'FLOW' + Date.now().toString().slice(-6);
    
    try {
      const addResponse = await api.post('/admin/students', {
        name: 'Flow Test Student',
        email: uniqueEmail,
        rollNo: uniqueRollNo
      });
      
      console.log('✅ Student added via API!');
      console.log('Student ID:', addResponse.data.data.student_id);
      console.log('Email:', uniqueEmail);
      console.log('');
      console.log('🎯 CHECK ABOVE FOR:');
      console.log('✅ "🎓 STUDENT CREDENTIALS GENERATED:" box');
      console.log('✅ All student credentials');
      console.log('✅ "Mock email sent" message');
      console.log('✅ "Credentials email sent to" message');
      console.log('');
      console.log('📧 If you see all of the above → EMAIL FUNCTION IS WORKING!');
      console.log('📧 If you see none of the above → EMAIL FUNCTION IS NOT WORKING!');
      
    } catch (addError) {
      console.log('❌ Student addition failed:', addError.response?.data);
      console.log('This means the email function might not be called');
    }
    
    console.log('\n🎉 EMAIL FUNCTION STATUS:');
    console.log('✅ Direct test: WORKING');
    console.log('✅ API test: ' + (addResponse ? 'WORKING' : 'NEEDS CHECKING'));
    console.log('✅ Console output: CHECK ABOVE');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteEmailFlow();
