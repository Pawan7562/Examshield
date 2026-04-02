// Debug current 400 error and email issues
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function debugCurrentIssues() {
  try {
    console.log('🔍 Debugging Current Issues: 400 Error & Email\n');
    
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
    
    // 1. Test authentication
    console.log('1. 🔐 Testing authentication...');
    try {
      const loginResponse = await api.post('/auth/college/login', {
        email: 'test@examshield.com',
        password: 'password123'
      });
      
      const { accessToken } = loginResponse.data.data;
      localStorage.setItem('accessToken', accessToken);
      console.log('✅ Authentication successful');
    } catch (loginError) {
      console.log('❌ Authentication failed:', loginError.response?.data);
      return;
    }
    
    // 2. Test students endpoint (the one causing 400)
    console.log('\n2. 👥 Testing students endpoint...');
    try {
      const studentsResponse = await api.get('/admin/students');
      console.log('✅ Students endpoint works:', studentsResponse.status);
      console.log('Students count:', studentsResponse.data.data.students?.length || 0);
    } catch (studentsError) {
      console.log('❌ Students endpoint FAILED:');
      console.log('Status:', studentsError.response?.status);
      console.log('Error:', studentsError.response?.data);
      
      if (studentsError.response?.status === 400) {
        console.log('\n🔧 400 Error Analysis:');
        console.log('This could be:');
        console.log('1. Backend controller issue');
        console.log('2. Database schema issue');
        console.log('3. Authentication middleware issue');
      }
    }
    
    // 3. Test student addition
    console.log('\n3. ➕ Testing student addition...');
    const uniqueRollNo = 'TEST' + Date.now().toString().slice(-6);
    const uniqueEmail = `student${Date.now()}@examshield.com`;
    
    try {
      const addResponse = await api.post('/admin/students', {
        name: 'Test Student',
        email: uniqueEmail,
        rollNo: uniqueRollNo
      });
      
      console.log('✅ Student addition successful!');
      console.log('Student ID:', addResponse.data.data.student_id);
      
    } catch (addError) {
      console.log('❌ Student addition FAILED:');
      console.log('Status:', addError.response?.status);
      console.log('Error:', addError.response?.data);
    }
    
    // 4. Check email configuration
    console.log('\n4. 📧 Checking email configuration...');
    console.log('Environment variables:');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'Not set (mock mode)');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
    
    console.log('\n📋 Email Status:');
    if (!process.env.EMAIL_HOST) {
      console.log('ℹ️  Email is in MOCK MODE (development)');
      console.log('ℹ️  Credentials are logged to console');
      console.log('ℹ️  No real emails are sent');
    } else {
      console.log('✅ Real email configuration detected');
      console.log('✅ Emails should be sent to students');
    }
    
    console.log('\n🎯 Solutions:');
    console.log('For 400 Error: Check backend console logs for detailed error');
    console.log('For Email: Configure EMAIL_* variables in .env file');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugCurrentIssues();
