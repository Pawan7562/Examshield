// Debug why students are not receiving emails
require('dotenv').config(); // Load .env at the top
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function debugStudentEmail() {
  try {
    console.log('🔍 Debugging: Why Students Not Receiving Emails\n');
    
    // 1. Check email configuration
    console.log('1. 📧 Current Email Configuration:');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET');
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ SET' : '❌ NOT SET');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET' : '❌ NOT SET');
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
    console.log('');
    
    // 2. Test direct email function
    console.log('2. 🧪 Testing Direct Email Function...');
    const { sendStudentCredentials } = require('./services/emailService');
    
    const testData = {
      name: 'Debug Test Student',
      email: 'codingcollege12@gmail.com', // Use the configured email
      studentId: 'ES-2026-DEBUG001',
      password: 'DebugTest123!',
      collegeName: 'Debug College',
      loginUrl: 'http://localhost:3000/student/login'
    };
    
    console.log('Sending test email to:', testData.email);
    console.log('Watch for success/error messages...\n');
    
    try {
      await sendStudentCredentials(testData);
      console.log('✅ Email function completed successfully!');
      
      if (process.env.EMAIL_HOST) {
        console.log('🎉 REAL EMAIL SHOULD BE SENT!');
        console.log('📧 Check your email inbox at:', testData.email);
        console.log('📧 Subject: "Welcome to ExamShield — Your Login Credentials"');
      } else {
        console.log('ℹ️  MOCK EMAIL MODE - Check console for credentials');
      }
      
    } catch (emailError) {
      console.log('❌ Email function failed:', emailError.message);
      
      if (emailError.message.includes('auth') || emailError.message.includes('login')) {
        console.log('🔧 Gmail Authentication Issues:');
        console.log('1. Check if app password is correct');
        console.log('2. Verify 2-factor authentication is enabled');
        console.log('3. Make sure "Less secure apps" is allowed');
      }
      
      if (emailError.message.includes('connect') || emailError.message.includes('ECONNREFUSED')) {
        console.log('🔧 Connection Issues:');
        console.log('1. Check internet connection');
        console.log('2. Verify SMTP settings');
        console.log('3. Check firewall blocking');
      }
    }
    
    // 3. Test via API (like frontend does)
    console.log('\n3. 🌐 Testing via API (Frontend Simulation)...');
    
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
    
    // Add student via API
    console.log('Adding student via API...');
    const uniqueEmail = `debug${Date.now()}@examshield.com`;
    const uniqueRollNo = 'DBG' + Date.now().toString().slice(-6);
    
    try {
      const addResponse = await api.post('/admin/students', {
        name: 'API Debug Student',
        email: uniqueEmail,
        rollNo: uniqueRollNo
      });
      
      console.log('✅ Student added via API!');
      console.log('Student ID:', addResponse.data.data.student_id);
      console.log('Email:', uniqueEmail);
      console.log('');
      console.log('🎯 CHECK:');
      console.log('✅ If you see "🎓 STUDENT CREDENTIALS GENERATED:" above → Email function called');
      console.log('✅ If you see "Mock email sent" → Mock mode');
      console.log('✅ If you see no email messages → Email function not called');
      console.log('✅ Check your Gmail inbox for real email');
      
    } catch (addError) {
      console.log('❌ Student addition failed:', addError.response?.data);
    }
    
    console.log('\n4. 📊 Diagnosis:');
    console.log('If direct email test works but API doesn\'t:');
    console.log('→ Email function works but not called from studentController');
    console.log('');
    console.log('If both direct and API work but no email received:');
    console.log('→ Email sent but blocked by Gmail or going to spam');
    console.log('');
    console.log('If neither works:');
    console.log('→ Email configuration or Gmail app password issue');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugStudentEmail();
