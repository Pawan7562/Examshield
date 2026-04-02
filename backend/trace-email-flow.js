// Trace the exact email flow when student is added
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function traceEmailFlow() {
  try {
    console.log('🔍 Tracing Email Flow: Student Addition Process\n');
    
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
    console.log('1. 🔐 Logging in...');
    const loginResponse = await api.post('/auth/college/login', {
      email: 'test@examshield.com',
      password: 'password123'
    });
    
    const { accessToken } = loginResponse.data.data;
    localStorage.setItem('accessToken', accessToken);
    console.log('✅ Logged in successfully');
    
    // 2. Add student and monitor console
    console.log('\n2. 👤 Adding student - WATCH CONSOLE CAREFULLY...');
    console.log('   Look for these messages in backend console:');
    console.log('   - "Mock email sent"');
    console.log('   - "Credentials email sent to"');
    console.log('   - Any error messages');
    console.log('');
    
    const uniqueEmail = `trace${Date.now()}@examshield.com`;
    const uniqueRollNo = 'TRACE' + Date.now().toString().slice(-6);
    
    console.log(`Adding student: ${uniqueEmail}`);
    
    try {
      const addResponse = await api.post('/admin/students', {
        name: 'Trace Test Student',
        email: uniqueEmail,
        rollNo: uniqueRollNo
      });
      
      console.log('✅ Student added successfully!');
      console.log('Student ID:', addResponse.data.data.student_id);
      console.log('');
      console.log('🔍 CHECK BACKEND CONSOLE NOW:');
      console.log('You should see one of these:');
      console.log('');
      console.log('✅ SUCCESS (Working):');
      console.log('Mock email sent {');
      console.log('  to: "' + uniqueEmail + '",');
      console.log('  subject: "Welcome to ExamShield...",');
      console.log('  text: "...Student ID: ... Password: ..."');
      console.log('}');
      console.log('Credentials email sent to ' + uniqueEmail);
      console.log('');
      console.log('❌ PROBLEM (Not Working):');
      console.log('Email send error: [error message]');
      console.log('Or no email messages at all');
      console.log('');
      
    } catch (addError) {
      console.log('❌ Student addition failed:', addError.response?.data);
    }
    
    // 3. Check if there's an issue with the email service
    console.log('\n3. 📧 Testing email service directly...');
    const { sendStudentCredentials } = require('./services/emailService');
    
    console.log('Testing email service with test data...');
    try {
      await sendStudentCredentials({
        name: 'Direct Test Student',
        email: 'directtest@examshield.com',
        studentId: 'ES-2026-999999',
        password: 'DirectTest123!',
        collegeName: 'Test College',
        loginUrl: 'http://localhost:3000/student/login'
      });
      console.log('✅ Direct email test successful');
      console.log('Check console for "Mock email sent" message');
    } catch (directError) {
      console.log('❌ Direct email test failed:', directError.message);
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('If you see NO "Mock email sent" messages:');
    console.log('1. Email function is not being called');
    console.log('2. There might be an error in studentController');
    console.log('3. The try-catch block is swallowing the error');
    console.log('');
    console.log('If you see "Mock email sent" but no credentials:');
    console.log('1. Email template issue (text showing "undefined")');
    console.log('2. Password generation issue');
    console.log('3. Student ID generation issue');
    console.log('');
    console.log('🔧 NEXT STEPS:');
    console.log('1. Add a student via frontend RIGHT NOW');
    console.log('2. Watch this console carefully');
    console.log('3. Tell me exactly what messages appear');
    console.log('4. I can then fix the specific issue');
    
  } catch (error) {
    console.error('❌ Trace failed:', error.message);
  }
}

traceEmailFlow();
