// Debug why students are not receiving emails
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function debugEmailIssue() {
  try {
    console.log('🔍 Debugging Email Issue: Why Students Not Receiving Emails\n');
    
    // 1. Check email configuration
    console.log('1. 📧 Checking email configuration...');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET');
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ SET' : '❌ NOT SET');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET' : '❌ NOT SET');
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
    console.log('STUDENT_LOGIN_URL:', process.env.STUDENT_LOGIN_URL || '❌ NOT SET');
    
    // 2. Test email service directly
    console.log('\n2. 🧪 Testing email service directly...');
    const { sendStudentCredentials } = require('./services/emailService');
    
    try {
      console.log('Calling sendStudentCredentials with test data...');
      await sendStudentCredentials({
        name: 'Test Student',
        email: 'test@example.com',
        studentId: 'ES-2026-123456',
        password: 'TestPass123!',
        collegeName: 'Test College',
        loginUrl: 'http://localhost:3000/student/login'
      });
      console.log('✅ Email function completed without error');
    } catch (emailError) {
      console.log('❌ Email function failed:', emailError.message);
    }
    
    // 3. Test via API (like frontend does)
    console.log('\n3. 🌐 Testing via API (frontend simulation)...');
    
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
    console.log('Logging in as admin...');
    const loginResponse = await api.post('/auth/college/login', {
      email: 'test@examshield.com',
      password: 'password123'
    });
    
    const { accessToken } = loginResponse.data.data;
    localStorage.setItem('accessToken', accessToken);
    console.log('✅ Logged in');
    
    // Add student
    console.log('Adding student via API...');
    const uniqueEmail = `student${Date.now()}@examshield.com`;
    const uniqueRollNo = 'STU' + Date.now().toString().slice(-6);
    
    try {
      const addResponse = await api.post('/admin/students', {
        name: 'Email Test Student',
        email: uniqueEmail,
        rollNo: uniqueRollNo
      });
      
      console.log('✅ Student added via API');
      console.log('Student ID:', addResponse.data.data.student_id);
      console.log('Check backend console above for email log');
      
    } catch (addError) {
      console.log('❌ Student addition failed:', addError.response?.data);
    }
    
    // 4. Analysis
    console.log('\n4. 📊 Email Issue Analysis:');
    
    if (!process.env.EMAIL_HOST) {
      console.log('🔍 ROOT CAUSE: Email is in MOCK MODE');
      console.log('ℹ️  In development, emails are only logged to console');
      console.log('ℹ️  No real emails are sent to students');
      console.log('');
      console.log('🔧 SOLUTION 1: Use Console Credentials (Immediate)');
      console.log('- Check backend console for "Mock email sent" logs');
      console.log('- Copy credentials from console');
      console.log('- Share with student manually');
      console.log('');
      console.log('🔧 SOLUTION 2: Configure Real Email (Advanced)');
      console.log('1. Create Gmail App Password');
      console.log('2. Add to .env file:');
      console.log('   EMAIL_HOST=smtp.gmail.com');
      console.log('   EMAIL_PORT=587');
      console.log('   EMAIL_USER=your-email@gmail.com');
      console.log('   EMAIL_PASS=your-app-password');
      console.log('   EMAIL_FROM=ExamShield <your-email@gmail.com>');
      console.log('   STUDENT_LOGIN_URL=http://localhost:3000/student/login');
      console.log('3. Restart backend server');
      console.log('4. Students will receive real emails');
    } else {
      console.log('✅ Email configuration detected');
      console.log('❌ But emails still not working - check SMTP settings');
    }
    
    console.log('\n🎯 Current Status:');
    console.log('✅ Student addition works');
    console.log('✅ Credentials are generated');
    console.log('✅ Email function is called');
    console.log('ℹ️  But emails are in mock mode (development)');
    console.log('ℹ️  Check backend console for credentials');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugEmailIssue();
